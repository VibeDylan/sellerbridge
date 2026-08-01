import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, IHeaders, Kafka, Producer } from 'kafkajs';
import { CommandBus } from '@nestjs/cqrs';
import { OpenKybCaseCommand } from '../commands/open-kyb-case.command';

interface SellerRegisteredEventPayload {
  sellerId: string;
}

const MAX_RETRIES = 3;
const RETRY_HEADER = 'x-retry-count';
const SOURCE_TOPIC = 'seller.registered';
const DLT_TOPIC = 'seller.registered.dlt';

@Injectable()
export class SellerEventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly consumer: Consumer;
  private readonly producer: Producer;

  constructor(
    configService: ConfigService,
    private readonly commandBus: CommandBus,
  ) {
    const kafka = new Kafka({
      clientId: 'kyb-service',
      brokers: [configService.getOrThrow<string>('KAFKA_BROKERS')],
    });

    this.consumer = kafka.consumer({ groupId: 'kyb-service' });
    this.producer = kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: SOURCE_TOPIC,
      fromBeginning: false,
    });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) {
          return;
        }

        const retryCount = this.readRetryCount(message.headers);

        try {
          const payload = JSON.parse(
            message.value.toString(),
          ) as SellerRegisteredEventPayload;

          await this.commandBus.execute(
            new OpenKybCaseCommand(payload.sellerId),
          );
        } catch (error) {
          if (retryCount < MAX_RETRIES) {
            await this.producer.send({
              topic: SOURCE_TOPIC,
              messages: [
                {
                  key: message.key,
                  value: message.value,
                  headers: {
                    ...message.headers,
                    [RETRY_HEADER]: String(retryCount + 1),
                  },
                },
              ],
            });
          } else {
            await this.producer.send({
              topic: DLT_TOPIC,
              messages: [
                {
                  key: message.key,
                  value: message.value,
                  headers: {
                    ...message.headers,
                    [RETRY_HEADER]: String(retryCount),
                    'x-error': String(error),
                  },
                },
              ],
            });
          }
        }
      },
    });
  }

  private readRetryCount(headers: IHeaders | undefined): number {
    const raw = headers?.[RETRY_HEADER];
    if (raw === undefined || Array.isArray(raw)) {
      return 0;
    }
    const parsed = parseInt(raw.toString(), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }
}
