import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateSellerKybStatusCommand } from './update-seller-kyb-status.command';
import { SellerRepository } from '../repository/seller.repository';

@CommandHandler(UpdateSellerKybStatusCommand)
export class UpdateSellerKybStatusHandler implements ICommandHandler<UpdateSellerKybStatusCommand> {
  constructor(private readonly sellerRepository: SellerRepository) {}

  async execute(command: UpdateSellerKybStatusCommand): Promise<string> {
    const { sellerId, kybStatus } = command;

    const updatedSeller = await this.sellerRepository.updateKybStatus(
      sellerId,
      kybStatus,
    );

    if (!updatedSeller) {
      throw new NotFoundException('Seller not found');
    }

    return updatedSeller.id;
  }
}
