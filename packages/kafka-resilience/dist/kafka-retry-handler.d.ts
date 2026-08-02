import { IHeaders, Producer } from 'kafkajs';
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
export declare class KafkaRetryHandler {
    private readonly producer;
    private readonly sourceTopic;
    private readonly dltTopic;
    private readonly maxRetries;
    constructor(options: KafkaRetryHandlerOptions);
    handle(message: RetryableMessage, process: () => Promise<void>): Promise<void>;
    private readRetryCount;
}
