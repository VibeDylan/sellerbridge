import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SellersController } from './sellers.controller';
import { RegisterSellerHandler } from './commands/register-seller.handler';
import { GetSellerHandler } from './queries/get-seller.handler';
import { SellerRepository } from './repository/seller.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerDocument, SellerSchema } from './repository/seller.schema';

@Module({
  imports: [
    CqrsModule.forRoot(),
    MongooseModule.forFeature([{ name: SellerDocument.name, schema: SellerSchema }])
  ],
  controllers: [SellersController],
  providers: [RegisterSellerHandler, GetSellerHandler, SellerRepository],
})
export class SellersModule {}