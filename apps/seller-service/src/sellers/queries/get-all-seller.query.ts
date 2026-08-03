import { Query } from '@nestjs/cqrs';
import { Seller } from '../models/seller.model';

export class GetAllSellerQuery extends Query<Seller[]> {
  constructor() {
    super();
  }
}
