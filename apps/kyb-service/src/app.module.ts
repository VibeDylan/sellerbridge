import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SellerEventConsumer } from './events/seller-registered.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
  ],
  controllers: [],
  providers: [SellerEventConsumer],
})
export class AppModule {}
