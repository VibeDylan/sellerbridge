import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetSellerQuery } from "./get-seller.query";
import { SellerRepository } from "../repository/seller.repository";
import { NotFoundException } from "@nestjs/common";

@QueryHandler(GetSellerQuery)
export class GetSellerHandler implements IQueryHandler<GetSellerQuery> {
    constructor(private readonly sellerRepository: SellerRepository) {}

    async execute(query: GetSellerQuery) {
        const seller = await this.sellerRepository.findById(query.sellerId);

        if(!seller) {
            throw new NotFoundException("Seller not found");
        }

        return seller;
    }
}