import { Injectable } from '@nestjs/common';
import { Seller } from '../models/seller.model';

@Injectable()
export class SellerRepository {
  private readonly sellers: Seller[] = [];

  async save(seller: Seller): Promise<Seller> {
    this.sellers.push(seller);
    return seller;
  }

  async findById(id: string): Promise<Seller | undefined> {
    return this.sellers.find((seller) => seller.id === id);
  }
}