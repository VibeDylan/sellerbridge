import { Seller } from '../models/seller.model';
import { SellerDocumentType } from './seller.schema';

export class SellerMapper {
  static toDomain(document: SellerDocumentType): Seller {
    return new Seller(
      document.id,
      document.companyName,
      document.email,
      document.siret,
      document.createdAt,
    );
  }

  static toPersistence(seller: Seller) {
    return {
      id: seller.id,
      companyName: seller.companyName,
      email: seller.email,
      siret: seller.siret,
      createdAt: seller.createdAt,
    };
  }
}
