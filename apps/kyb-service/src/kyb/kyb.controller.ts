import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { UpdateKybCaseDto } from './dto/update-kyb-case.dto';
import { ReviewKybCommand } from './commands/review-kyb.command';
import { ReviewKybBySellerCommand } from './commands/review-kyb-by-seller.command';

@ApiTags('kyb')
@Controller('kyb')
export class KybController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/review')
  async reviewKyb(@Param('id') id: string, @Body() dto: UpdateKybCaseDto) {
    const reviewId = await this.commandBus.execute(
      new ReviewKybCommand(id, dto.status),
    );

    return { reviewId };
  }

  @Post('by-seller/:sellerId/review')
  async reviewKybBySeller(
    @Param('sellerId') sellerId: string,
    @Body() dto: UpdateKybCaseDto,
  ) {
    const reviewId = await this.commandBus.execute(
      new ReviewKybBySellerCommand(sellerId, dto.status),
    );

    return { reviewId };
  }
}
