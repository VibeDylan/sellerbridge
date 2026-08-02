"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaRetryHandler = void 0;
const RETRY_HEADER = 'x-retry-count';
const ERROR_HEADER = 'x-error';
const DEFAULT_MAX_RETRIES = 3;
/**
 * Wraps a Kafka message handler with a retry-via-headers + dead letter
 * topic strategy: on failure, republishes the message to the source topic
 * with an incremented retry-count header, and once maxRetries is exceeded,
 * publishes it to `${sourceTopic}.dlt` instead. Either way, the current
 * message is considered handled so the partition is never blocked.
 */
class KafkaRetryHandler {
    constructor(options) {
        this.producer = options.producer;
        this.sourceTopic = options.sourceTopic;
        this.dltTopic = `${options.sourceTopic}.dlt`;
        this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    }
    async handle(message, process) {
        const retryCount = this.readRetryCount(message.headers);
        try {
            await process();
        }
        catch (error) {
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
            }
            else {
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
    readRetryCount(headers) {
        const raw = headers?.[RETRY_HEADER];
        if (raw === undefined || Array.isArray(raw)) {
            return 0;
        }
        const parsed = parseInt(raw.toString(), 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
}
exports.KafkaRetryHandler = KafkaRetryHandler;
