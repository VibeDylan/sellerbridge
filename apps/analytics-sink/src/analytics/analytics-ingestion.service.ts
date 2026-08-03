import { Injectable } from '@nestjs/common';
import { BigQuery } from '@google-cloud/bigquery';

const DATASET_ID = 'sellerbridge_analytics';
const SELLER_REGISTRATIONS_TABLE = 'seller_registrations';
const KYB_REVIEWS_TABLE = 'kyb_reviews';

export interface SellerRegistrationRow {
  sellerId: string;
  companyName: string;
  email: string;
  siret: string;
  registeredAt: Date;
}

export interface KybReviewRow {
  kybCaseId: string;
  sellerId: string;
  verdict: string;
  reviewedAt: Date;
}

@Injectable()
export class AnalyticsIngestionService {
  private readonly bigQuery: BigQuery;

  constructor() {
    this.bigQuery = new BigQuery();
  }

  async insertSellerRegistration(row: SellerRegistrationRow): Promise<void> {
    await this.bigQuery
      .dataset(DATASET_ID)
      .table(SELLER_REGISTRATIONS_TABLE)
      .insert([
        {
          seller_id: row.sellerId,
          company_name: row.companyName,
          email: row.email,
          siret: row.siret,
          registered_at: row.registeredAt,
        },
      ]);
  }

  async insertKybReview(row: KybReviewRow): Promise<void> {
    await this.bigQuery
      .dataset(DATASET_ID)
      .table(KYB_REVIEWS_TABLE)
      .insert([
        {
          kyb_case_id: row.kybCaseId,
          seller_id: row.sellerId,
          verdict: row.verdict,
          reviewed_at: row.reviewedAt,
        },
      ]);
  }
}
