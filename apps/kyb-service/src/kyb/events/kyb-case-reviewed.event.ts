import { KybStatus } from "../models/kyb-case.model";

export class KybCaseReviewedEvent {
  constructor(
    public readonly id: string,
    public readonly sellerId: string,
    public readonly status: KybStatus,
    public readonly updatedAt: Date
  ) {}
}
