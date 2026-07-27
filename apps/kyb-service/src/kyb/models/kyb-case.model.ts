
export const KybStatus = {
  Pending: 'pending',
  Rejected: 'rejected',
  Approved: 'approved',
} as const;

export type KybStatus = (typeof KybStatus)[keyof typeof KybStatus];

export class KybCase {
    constructor(
        readonly id: string,
        readonly sellerId: string,
        public status: KybStatus,
        readonly createdAt: Date,
        public updatedAt: Date
    ){}
}