import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { KybCaseDocument, KybCaseSchema } from './repository/kyb-case.schema';
import { OpenKybCaseHandler } from './commands/open-kyb-case.handler';
import { KybCaseRepository } from './repository/kyb-case.repository';
import { SellerEventConsumer } from '../events/seller-registered.consumer';

@Module({
  imports: [
    CqrsModule.forRoot(),
    MongooseModule.forFeature([
      { name: KybCaseDocument.name, schema: KybCaseSchema },
    ]),
  ],
  controllers: [],
  providers: [
    OpenKybCaseHandler,
    KybCaseRepository,
    SellerEventConsumer,
  ],
})
export class KybModule {}
