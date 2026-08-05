import { Command } from '@nestjs/cqrs';
import { KybStatus } from '../models/kyb-case.model';

export class ReviewKybBySellerCommand extends Command<string> {
  constructor(
    public readonly sellerId: string,
    public readonly status: KybStatus,
  ) {
    super();
  }
}
