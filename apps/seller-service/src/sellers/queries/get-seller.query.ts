import { Query } from "@nestjs/cqrs";
import { Seller } from '../models/seller.model'

export class GetSellerQuery extends Query<Seller> {
    constructor(public readonly sellerId: string) {
        super()
    }
}