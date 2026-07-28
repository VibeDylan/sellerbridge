import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OpenKybCaseCommand } from './open-kyb-case.command';
import { KybCaseRepository } from '../repository/kyb-case.repository';
import { KybCase, KybStatus } from '../models/kyb-case.model';

@CommandHandler(OpenKybCaseCommand)
export class OpenKybCaseHandler
  implements ICommandHandler<OpenKybCaseCommand>
{
  constructor(private readonly kybCaseRepository: KybCaseRepository) {}

  async execute(command: OpenKybCaseCommand): Promise<string> {
    const { sellerId } = command;

    const existingKybCase =
      await this.kybCaseRepository.findBySellerId(sellerId);

    if (existingKybCase) {
      return existingKybCase.id;
    }

    const id = crypto.randomUUID();
    const createdAt = new Date();

    const kybCase = new KybCase(
      id,
      sellerId,
      KybStatus.Pending,
      createdAt,
      createdAt,
    );
    await this.kybCaseRepository.save(kybCase);

    return id;
  }
}