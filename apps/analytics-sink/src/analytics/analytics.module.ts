import { Module } from '@nestjs/common';
import { AnalyticsIngestionService } from './analytics-ingestion.service';
import { AnalyticsConsumer } from './analytics.consumer';

@Module({
  providers: [AnalyticsIngestionService, AnalyticsConsumer],
})
export class AnalyticsModule {}
