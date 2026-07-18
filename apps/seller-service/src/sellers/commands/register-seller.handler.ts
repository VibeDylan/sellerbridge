import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { RegisterSellerCommand } from "./register-seller.command";
import { SellerRepository } from "../repository/seller.repository";
import { Seller } from "../models/seller.model";

@CommandHandler(RegisterSellerCommand)
export class RegisterSellerHandler implements ICommandHandler<RegisterSellerCommand, string> {
    constructor(private readonly sellerRepository: SellerRepository) {}

    async execute(command: RegisterSellerCommand) {
        const { companyName, siret, email } = command;
        const id = crypto.randomUUID();
        const createdAt = new Date();

        const seller = new Seller(
            id,
            companyName,
            email,
            siret,
            createdAt
        );
        
        await this.sellerRepository.save(seller);

        return id;
    }
}