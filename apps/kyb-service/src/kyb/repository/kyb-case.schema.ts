import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { KybStatus } from '../models/kyb-case.model';

@Schema()
export class KybCaseDocument {
  @Prop()
  id: string;

  @Prop()
  sellerId: string;

  @Prop({ type: String, enum: Object.values(KybStatus) })
  status: KybStatus;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type KybCaseDocumentType = HydratedDocument<KybCaseDocument>;

export const KybCaseSchema = SchemaFactory.createForClass(KybCaseDocument);
