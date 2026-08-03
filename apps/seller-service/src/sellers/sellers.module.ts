import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SellersController } from './sellers.controller';
import { RegisterSellerHandler } from './commands/register-seller.handler';
import { UpdateSellerKybStatusHandler } from './commands/update-seller-kyb-status.handler';
import { GetSellerHandler } from './queries/get-seller.handler';
import { GetAllSellerHandler } from './queries/get-all-seller.handler';
import { SellerRepository } from './repository/seller.repository';
import { SellerEventsPublisher } from './events/seller-events.publisher';
import { KybReviewedConsumer } from './events/kyb-reviewed.consumer';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerDocument, SellerSchema } from './repository/seller.schema';

@Module({
  imports: [
    CqrsModule.forRoot(),
    MongooseModule.forFeature([
      { name: SellerDocument.name, schema: SellerSchema },
    ]),
  ],
  controllers: [SellersController],
  providers: [
    RegisterSellerHandler,
    UpdateSellerKybStatusHandler,
    GetSellerHandler,
    GetAllSellerHandler,
    SellerRepository,
    SellerEventsPublisher,
    KybReviewedConsumer,
  ],
})
export class SellersModule {}
