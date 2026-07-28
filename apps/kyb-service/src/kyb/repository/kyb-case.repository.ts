import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KybCaseDocument, KybCaseDocumentType } from './kyb-case.schema';
import { KybCase } from '../models/kyb-case.model';
import { KybCaseMapper } from './kyb-case.mapper';


@Injectable()
export class KybCaseRepository {
  constructor(
    @InjectModel(KybCaseDocument.name)
    private readonly kybCaseModel: Model<KybCaseDocumentType>,
  ) {}

  async save(kybCase: KybCase): Promise<KybCase> {
    const data = KybCaseMapper.toPersistence(kybCase);

    await this.kybCaseModel.create(data);

    return kybCase;
  }

  async findBySellerId(sellerId: string): Promise<KybCase | null> {
    const document = await this.kybCaseModel.findOne({ sellerId });

    if (!document) {
      return null;
    }

    return KybCaseMapper.toDomain(document);
  }
}
