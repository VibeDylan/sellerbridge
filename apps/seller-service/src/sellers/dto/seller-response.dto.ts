import { ApiProperty } from '@nestjs/swagger';
import { Seller, SellerKybStatus } from '../models/seller.model';

export class SellerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  siret: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ enum: Object.values(SellerKybStatus) })
  kybStatus: SellerKybStatus;

  static fromDomain(seller: Seller): SellerResponseDto {
    const dto = new SellerResponseDto();
    dto.id = seller.id;
    dto.companyName = seller.companyName;
    dto.email = seller.email;
    dto.siret = seller.siret;
    dto.createdAt = seller.createdAt;
    dto.kybStatus = seller.kybStatus;
    return dto;
  }
}
