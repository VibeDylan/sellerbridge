import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { RegisterSellerCommand } from './commands/register-seller.command';
import { GetSellerQuery } from './queries/get-seller.query';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async registerSeller(@Body() dto: RegisterSellerDto) {
    const id = await this.commandBus.execute(
      new RegisterSellerCommand(dto.companyName, dto.email, dto.siret),
    );

    return { id };
  }

  @Get(':id')
  async getSellerById(@Param('id') id: string) {
    return this.queryBus.execute(new GetSellerQuery(id));
  }
}