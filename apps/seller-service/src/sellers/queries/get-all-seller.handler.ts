import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SellerRepository } from '../repository/seller.repository';
import { Seller } from '../models/seller.model';
import { GetAllSellerQuery } from './get-all-seller.query';

@QueryHandler(GetAllSellerQuery)
export class GetAllSellerHandler implements IQueryHandler<GetAllSellerQuery> {
  constructor(private readonly sellerRepository: SellerRepository) {}

  async execute(): Promise<Seller[]> {
    return this.sellerRepository.findAll();
  }
}
