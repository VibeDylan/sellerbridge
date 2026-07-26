export class SellerRegisteredEvent {
    constructor(
        public readonly sellerId: string,
        public readonly companyName: string,
        public readonly email: string,
        public readonly siret: string,
        public readonly createdAt: Date,
    ){}
}