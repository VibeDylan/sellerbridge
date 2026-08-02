import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka, Producer } from 'kafkajs';
import { CommandBus } from '@nestjs/cqrs';
import { KafkaRetryHandler } from 'kafka-resilience';
import { UpdateSellerKybStatusCommand } from '../commands/update-seller-kyb-status.command';
import { SellerKybStatus } from '../models/seller.model';

interface KybReviewedEventPayload {
  sellerId: string;
  status: SellerKybStatus;
}

const SOURCE_TOPIC = 'kyb.reviewed';

@Injectable()
export class KybReviewedConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly consumer: Consumer;
  private readonly producer: Producer;
  private readonly retryHandler: KafkaRetryHandler;

  constructor(
    configService: ConfigService,
    private readonly commandBus: CommandBus,
  ) {
    const kafka = new Kafka({
      clientId: 'seller-service',
      brokers: [configService.getOrThrow<string>('KAFKA_BROKERS')],
    });

    this.consumer = kafka.consumer({
      groupId: 'seller-service',
    });
    this.producer = kafka.producer();
    this.retryHandler = new KafkaRetryHandler({
      producer: this.producer,
      sourceTopic: SOURCE_TOPIC,
    });
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

        await this.retryHandler.handle(message, async () => {
          const payload = JSON.parse(
            message.value!.toString(),
          ) as KybReviewedEventPayload;

          await this.commandBus.execute(
            new UpdateSellerKybStatusCommand(payload.sellerId, payload.status),
          );
        });
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }
}
