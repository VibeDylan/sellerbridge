import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SellerKybStatus } from '../models/seller.model';

@Schema()
export class SellerDocument {
  @Prop()
  id: string;

  @Prop()
  companyName: string;

  @Prop()
  email: string;

  @Prop()
  siret: string;

  @Prop()
  createdAt: Date;

  @Prop({ type: String, enum: Object.values(SellerKybStatus) })
  kybStatus: SellerKybStatus;
}

export type SellerDocumentType = HydratedDocument<SellerDocument>;

export const SellerSchema = SchemaFactory.createForClass(SellerDocument);
