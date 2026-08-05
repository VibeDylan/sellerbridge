import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { KybCaseRepository } from '../repository/kyb-case.repository';
import { KybCaseEventsPublisher } from '../events/kyb-case-events.publisher';
import { ReviewKybBySellerCommand } from './review-kyb-by-seller.command';

@CommandHandler(ReviewKybBySellerCommand)
export class ReviewKybBySellerHandler implements ICommandHandler<ReviewKybBySellerCommand> {
  constructor(
    private readonly kybCaseRepository: KybCaseRepository,
    private readonly kybCaseEventsPublisher: KybCaseEventsPublisher,
  ) {}

  async execute(command: ReviewKybBySellerCommand): Promise<string> {
    const { sellerId, status } = command;

    const updatedKybCase = await this.kybCaseRepository.updateStatusBySellerId(
      sellerId,
      status,
    );

    if (!updatedKybCase) {
      throw new NotFoundException('KYB case not found for this seller');
    }

    await this.kybCaseEventsPublisher.publishKybReviewed(updatedKybCase);

    return updatedKybCase.id;
  }
}
