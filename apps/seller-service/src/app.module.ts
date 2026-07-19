import { Module } from '@nestjs/common';
import { SellersModule } from './sellers/sellers.module';

@Module({
  imports: [SellersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
