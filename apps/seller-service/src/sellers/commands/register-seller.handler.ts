import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterSellerCommand } from './register-seller.command';
import { SellerRepository } from '../repository/seller.repository';
import { SellerEventsPublisher } from '../events/seller-events.publisher';
import { Seller, SellerKybStatus } from '../models/seller.model';

@CommandHandler(RegisterSellerCommand)
export class RegisterSellerHandler implements ICommandHandler<
  RegisterSellerCommand,
  string
> {
  constructor(
    private readonly sellerRepository: SellerRepository,
    private readonly sellerEventsPublisher: SellerEventsPublisher,
  ) {}

  async execute(command: RegisterSellerCommand) {
    const { companyName, siret, email } = command;
    const id = crypto.randomUUID();
    const createdAt = new Date();

    const seller = new Seller(
      id,
      companyName,
      email,
      siret,
      createdAt,
      SellerKybStatus.Pending,
    );

    await this.sellerRepository.save(seller);
    await this.sellerEventsPublisher.publishSellerRegistered(seller);

    return id;
  }
}
