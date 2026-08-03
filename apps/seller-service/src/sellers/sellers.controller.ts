import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { SellerResponseDto } from './dto/seller-response.dto';
import { RegisterSellerCommand } from './commands/register-seller.command';
import { GetSellerQuery } from './queries/get-seller.query';
import { GetAllSellerQuery } from './queries/get-all-seller.query';
import { Seller } from './models/seller.model';

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
  async getSellerById(@Param('id') id: string): Promise<SellerResponseDto> {
    const seller = await this.queryBus.execute<GetSellerQuery, Seller>(
      new GetSellerQuery(id),
    );

    return SellerResponseDto.fromDomain(seller);
  }

  @Get()
  async getAllSeller(): Promise<SellerResponseDto[]> {
    const sellers = await this.queryBus.execute<GetAllSellerQuery, Seller[]>(
      new GetAllSellerQuery(),
    );

    return sellers.map((seller) => SellerResponseDto.fromDomain(seller));
  }
}
