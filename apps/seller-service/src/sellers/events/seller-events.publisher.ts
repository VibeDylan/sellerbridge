import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { Seller } from '../models/seller.model';
import { SellerRegisteredEvent } from './seller-registered.event';

@Injectable()
export class SellerEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly producer: Producer;

  constructor(configService: ConfigService) {
    const kafka = new Kafka({
      clientId: 'seller-service',
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

  async publishSellerRegistered(seller: Seller): Promise<void> {
    const event = new SellerRegisteredEvent(
      seller.id,
      seller.companyName,
      seller.email,
      seller.siret,
      seller.createdAt,
    );

    await this.producer.send({
      topic: 'seller.registered',
      messages: [{ key: seller.id, value: JSON.stringify(event) }],
    });
  }
}