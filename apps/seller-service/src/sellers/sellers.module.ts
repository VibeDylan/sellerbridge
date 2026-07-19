import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SellersController } from './sellers.controller';
import { RegisterSellerHandler } from './commands/register-seller.handler';
import { GetSellerHandler } from './queries/get-seller.handler';
import { SellerRepository } from './repository/seller.repository';

@Module({
  imports: [CqrsModule.forRoot()],
  controllers: [SellersController],
  providers: [RegisterSellerHandler, GetSellerHandler, SellerRepository],
})
export class SellersModule {}