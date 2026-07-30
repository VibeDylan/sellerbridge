import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka } from 'kafkajs';
import { CommandBus } from '@nestjs/cqrs';
import { OpenKybCaseCommand } from '../commands/open-kyb-case.command';

interface SellerRegisteredEventPayload {
  sellerId: string;
}

@Injectable()
export class SellerEventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly consumer: Consumer;

  constructor(
    configService: ConfigService,
    private readonly commandBus: CommandBus,
  ) {
    const kafka = new Kafka({
      clientId: 'kyb-service',
      brokers: [configService.getOrThrow<string>('KAFKA_BROKERS')],
    });

    this.consumer = kafka.consumer({
      groupId: 'kyb-service',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: 'seller.registered',
      fromBeginning: false,
    });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) {
          return;
        }

        const payload = JSON.parse(
          message.value.toString(),
        ) as SellerRegisteredEventPayload;

        await this.commandBus.execute(new OpenKybCaseCommand(payload.sellerId));
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }
}
