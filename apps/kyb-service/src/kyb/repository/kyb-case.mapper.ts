import { KybCase } from "../models/kyb-case.model";
import { KybCaseDocumentType } from "./kyb-case.schema";


export class KybCaseMapper {
  static toDomain(document: KybCaseDocumentType): KybCase {
    return new KybCase(
        document.id,
        document.sellerId,
        document.status,
        document.createdAt,
        document.updatedAt
    );
  }

  static toPersistence(kybCase: KybCase) {
    return {
      id: kybCase.id,
      sellerId: kybCase.sellerId,
      status: kybCase.status,
      createdAt: kybCase.createdAt,
      updatedAt: kybCase.updatedAt,
    };
  }
}
