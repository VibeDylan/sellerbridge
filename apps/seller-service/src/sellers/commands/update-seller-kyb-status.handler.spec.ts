import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateSellerKybStatusHandler } from './update-seller-kyb-status.handler';
import { UpdateSellerKybStatusCommand } from './update-seller-kyb-status.command';
import { SellerRepository } from '../repository/seller.repository';
import { Seller, SellerKybStatus } from '../models/seller.model';

type MockedSellerRepository = jest.Mocked<
  Pick<SellerRepository, 'updateKybStatus'>
>;

describe('UpdateSellerKybStatusHandler', () => {
  let handler: UpdateSellerKybStatusHandler;
  let sellerRepository: MockedSellerRepository;

  beforeEach(async () => {
    sellerRepository = {
      updateKybStatus: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UpdateSellerKybStatusHandler,
        { provide: SellerRepository, useValue: sellerRepository },
      ],
    }).compile();

    handler = moduleRef.get(UpdateSellerKybStatusHandler);
  });

  it('updates the kybStatus and returns the seller id when found', async () => {
    const updatedSeller = new Seller(
      'seller-123',
      'Acme Corp',
      'acme@example.com',
      '73282932000074',
      new Date(),
      SellerKybStatus.Approved,
    );
    sellerRepository.updateKybStatus.mockResolvedValue(updatedSeller);

    const command = new UpdateSellerKybStatusCommand(
      'seller-123',
      SellerKybStatus.Approved,
    );
    const id = await handler.execute(command);

    expect(sellerRepository.updateKybStatus).toHaveBeenCalledWith(
      'seller-123',
      SellerKybStatus.Approved,
    );
    expect(id).toBe('seller-123');
  });

  it('throws NotFoundException when no seller matches the id', async () => {
    sellerRepository.updateKybStatus.mockResolvedValue(null);

    const command = new UpdateSellerKybStatusCommand(
      'unknown-id',
      SellerKybStatus.Rejected,
    );

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
