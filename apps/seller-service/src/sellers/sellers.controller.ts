import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { RegisterSellerDto } from "./dto/register-seller.dto";
import { RegisterSellerCommand } from "./commands/register-seller.command";
import { GetSellerQuery } from "./queries/get-seller.query";

@Controller('sellers')
export class SellersController {
    constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

    @Post()
    async registerSeller(@Body() dto: RegisterSellerDto) {
        return this.commandBus.execute(new RegisterSellerCommand(
            dto.companyName,
            dto.email,
            dto.siret
        ))
    }

    @Get(':id')
    async getSellerById(@Param('id') id: string) {
        return this.queryBus.execute(new GetSellerQuery(id))
    }
}