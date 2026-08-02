import { IHeaders, Producer } from 'kafkajs';

const RETRY_HEADER = 'x-retry-count';
const ERROR_HEADER = 'x-error';
const DEFAULT_MAX_RETRIES = 3;

export interface RetryableMessage {
  key: Buffer | string | null;
  value: Buffer | string | null;
  headers?: IHeaders;
}

export interface KafkaRetryHandlerOptions {
  producer: Producer;
  sourceTopic: string;
  maxRetries?: number;
}

/**
 * Wraps a Kafka message handler with a retry-via-headers + dead letter
 * topic strategy: on failure, republishes the message to the source topic
 * with an incremented retry-count header, and once maxRetries is exceeded,
 * publishes it to `${sourceTopic}.dlt` instead. Either way, the current
 * message is considered handled so the partition is never blocked.
 */
export class KafkaRetryHandler {
  private readonly producer: Producer;
  private readonly sourceTopic: string;
  private readonly dltTopic: string;
  private readonly maxRetries: number;

  constructor(options: KafkaRetryHandlerOptions) {
    this.producer = options.producer;
    this.sourceTopic = options.sourceTopic;
    this.dltTopic = `${options.sourceTopic}.dlt`;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  async handle(
    message: RetryableMessage,
    process: () => Promise<void>,
  ): Promise<void> {
    const retryCount = this.readRetryCount(message.headers);

    try {
      await process();
    } catch (error) {
      if (retryCount < this.maxRetries) {
        await this.producer.send({
          topic: this.sourceTopic,
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
          topic: this.dltTopic,
          messages: [
            {
              key: message.key,
              value: message.value,
              headers: {
                ...message.headers,
                [RETRY_HEADER]: String(retryCount),
                [ERROR_HEADER]: String(error),
              },
            },
          ],
        });
      }
    }
  }

  private readRetryCount(headers: IHeaders | undefined): number {
    const raw = headers?.[RETRY_HEADER];
    if (raw === undefined || Array.isArray(raw)) {
      return 0;
    }
    const parsed = parseInt(raw.toString(), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
