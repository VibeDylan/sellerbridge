import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Seller } from '../models/seller.model';
import { SellerDocument, SellerDocumentType } from './seller.schema';
import { SellerMapper } from './seller.mapper';

@Injectable()
export class SellerRepository {
  constructor(
    @InjectModel(SellerDocument.name)
    private readonly sellerModel: Model<SellerDocumentType>,
  ) {}

  async save(seller: Seller): Promise<Seller> {
    const data = SellerMapper.toPersistence(seller);

    await this.sellerModel.create(data);

    return seller;
  }

  async findById(id: string): Promise<Seller | null> {
    const document = await this.sellerModel.findOne({ id });

    if (!document) {
      return null;
    }

    return SellerMapper.toDomain(document);
  }
}
