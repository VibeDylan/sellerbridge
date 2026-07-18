import { Command } from "@nestjs/cqrs"

export class RegisterSellerCommand extends Command<string> {
    constructor(public readonly companyName: string, public readonly email: string, public readonly siret: string) {
        super()
    }
}