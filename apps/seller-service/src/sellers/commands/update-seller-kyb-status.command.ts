import { Command } from '@nestjs/cqrs';
import { SellerKybStatus } from '../models/seller.model';

export class UpdateSellerKybStatusCommand extends Command<string> {
  constructor(
    public readonly sellerId: string,
    public readonly kybStatus: SellerKybStatus,
  ) {
    super();
  }
}
