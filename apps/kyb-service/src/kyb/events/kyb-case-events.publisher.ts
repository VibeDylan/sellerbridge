import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { KybCaseReviewedEvent } from './kyb-case-reviewed.event';
import { KybCase } from '../models/kyb-case.model';

@Injectable()
export class KybCaseEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly producer: Producer;

  constructor(configService: ConfigService) {
    const kafka = new Kafka({
      clientId: 'kyb-service',
      brokers: [configService.getOrThrow<string>('KAFKA_BROKERS')],
    });

    this.producer = kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publishKybReviewed(kybCase: KybCase): Promise<void> {
    const event = new KybCaseReviewedEvent(
      kybCase.id,
      kybCase.sellerId,
      kybCase.status,
      kybCase.updatedAt
    );

    await this.producer.send({
      topic: 'kyb.reviewed',
      messages: [{ key: kybCase.id, value: JSON.stringify(event) }],
    });
  }
}