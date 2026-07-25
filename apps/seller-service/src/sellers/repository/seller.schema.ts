import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
}

export type SellerDocumentType = HydratedDocument<SellerDocument>;

export const SellerSchema = SchemaFactory.createForClass(SellerDocument);
