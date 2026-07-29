import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { KybCaseRepository } from '../repository/kyb-case.repository';
import { ReviewKybCommand } from './review-kyb.command';

@CommandHandler(ReviewKybCommand)
export class ReviewKybHandler implements ICommandHandler<ReviewKybCommand> {
  constructor(private readonly kybCaseRepository: KybCaseRepository) {}

  async execute(command: ReviewKybCommand): Promise<string> {
    const { id, status } = command;

    const updatedKybCase = await this.kybCaseRepository.updateStatus(
      id,
      status,
    );

    if (!updatedKybCase) {
      throw new NotFoundException('KYB case not found');
    }

    return updatedKybCase.id;
  }
}
