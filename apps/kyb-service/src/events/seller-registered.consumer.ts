import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka } from 'kafkajs';

@Injectable()
export class SellerEventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly consumer: Consumer;

  constructor(configService: ConfigService) {
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
      eachMessage: ({ message }) => {
        console.log({
          key: message.key?.toString() ?? null,
          value: message.value?.toString() ?? null,
          headers: message.headers,
        });

        return Promise.resolve();
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }
}
