export class Seller {
    constructor(readonly id: string, public companyName: string, public email: string, readonly siret: string, readonly createdAt: Date) {
    }
}