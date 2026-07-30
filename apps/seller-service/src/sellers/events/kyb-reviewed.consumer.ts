import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka } from 'kafkajs';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateSellerKybStatusCommand } from '../commands/update-seller-kyb-status.command';
import { SellerKybStatus } from '../models/seller.model';

interface KybReviewedEventPayload {
  sellerId: string;
  status: SellerKybStatus;
}

@Injectable()
export class KybReviewedConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly consumer: Consumer;

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
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: 'kyb.reviewed',
      fromBeginning: false,
    });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) {
          return;
        }

        const payload = JSON.parse(
          message.value.toString(),
        ) as KybReviewedEventPayload;

        await this.commandBus.execute(
          new UpdateSellerKybStatusCommand(payload.sellerId, payload.status),
        );
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }
}
