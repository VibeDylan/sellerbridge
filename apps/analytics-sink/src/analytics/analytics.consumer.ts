import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka, Producer } from 'kafkajs';
import { KafkaRetryHandler } from 'kafka-resilience';
import { AnalyticsIngestionService } from './analytics-ingestion.service';

interface SellerRegisteredEventPayload {
  sellerId: string;
  companyName: string;
  email: string;
  siret: string;
  createdAt: string;
}

interface KybReviewedEventPayload {
  id: string;
  sellerId: string;
  status: string;
  updatedAt: string;
}

const SELLER_REGISTERED_TOPIC = 'seller.registered';
const KYB_REVIEWED_TOPIC = 'kyb.reviewed';

@Injectable()
export class AnalyticsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly consumer: Consumer;
  private readonly producer: Producer;
  private readonly sellerRegisteredRetryHandler: KafkaRetryHandler;
  private readonly kybReviewedRetryHandler: KafkaRetryHandler;

  constructor(
    configService: ConfigService,
    private readonly analyticsIngestionService: AnalyticsIngestionService,
  ) {
    const kafka = new Kafka({
      clientId: 'analytics-sink',
      brokers: [configService.getOrThrow<string>('KAFKA_BROKERS')],
    });

    this.consumer = kafka.consumer({ groupId: 'analytics-sink' });
    this.producer = kafka.producer();

    this.sellerRegisteredRetryHandler = new KafkaRetryHandler({
      producer: this.producer,
      sourceTopic: SELLER_REGISTERED_TOPIC,
    });
    this.kybReviewedRetryHandler = new KafkaRetryHandler({
      producer: this.producer,
      sourceTopic: KYB_REVIEWED_TOPIC,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: [SELLER_REGISTERED_TOPIC, KYB_REVIEWED_TOPIC],
      fromBeginning: true,
    });
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) {
          return;
        }

        if (topic === SELLER_REGISTERED_TOPIC) {
          await this.sellerRegisteredRetryHandler.handle(message, async () => {
            const payload = JSON.parse(
              message.value!.toString(),
            ) as SellerRegisteredEventPayload;

            await this.analyticsIngestionService.insertSellerRegistration({
              sellerId: payload.sellerId,
              companyName: payload.companyName,
              email: payload.email,
              siret: payload.siret,
              registeredAt: new Date(payload.createdAt),
            });
          });
        } else if (topic === KYB_REVIEWED_TOPIC) {
          await this.kybReviewedRetryHandler.handle(message, async () => {
            const payload = JSON.parse(
              message.value!.toString(),
            ) as KybReviewedEventPayload;

            await this.analyticsIngestionService.insertKybReview({
              kybCaseId: payload.id,
              sellerId: payload.sellerId,
              verdict: payload.status,
              reviewedAt: new Date(payload.updatedAt),
            });
          });
        }
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }
}
