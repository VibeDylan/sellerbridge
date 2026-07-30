export const SellerKybStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;

export type SellerKybStatus =
  (typeof SellerKybStatus)[keyof typeof SellerKybStatus];

export class Seller {
  constructor(
    readonly id: string,
    public companyName: string,
    public email: string,
    readonly siret: string,
    readonly createdAt: Date,
    public kybStatus: SellerKybStatus,
  ) {}
}
