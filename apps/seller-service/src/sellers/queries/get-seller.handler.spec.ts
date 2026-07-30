import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetSellerHandler } from './get-seller.handler';
import { GetSellerQuery } from './get-seller.query';
import { SellerRepository } from '../repository/seller.repository';
import { Seller, SellerKybStatus } from '../models/seller.model';

type MockedSellerRepository = jest.Mocked<
  Pick<SellerRepository, 'save' | 'findById'>
>;

describe('GetSellerHandler', () => {
  let handler: GetSellerHandler;
  let sellerRepository: MockedSellerRepository;

  beforeEach(async () => {
    sellerRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetSellerHandler,
        { provide: SellerRepository, useValue: sellerRepository },
      ],
    }).compile();

    handler = moduleRef.get(GetSellerHandler);
  });

  it('returns the seller when the repository finds one', async () => {
    const seller = new Seller(
      '145fd20c-9774-4ce7-a0fc-ef7e008faa2c',
      'Acme Corp',
      'acme@example.com',
      '73282932000074',
      new Date(),
      SellerKybStatus.Pending,
    );
    sellerRepository.findById.mockResolvedValue(seller);

    const query = new GetSellerQuery(seller.id);
    const result = await handler.execute(query);

    expect(sellerRepository.findById).toHaveBeenCalledWith(seller.id);
    expect(result).toBe(seller);
  });

  it('throws NotFoundException when the repository finds nothing', async () => {
    sellerRepository.findById.mockResolvedValue(null);

    const query = new GetSellerQuery('unknown-id');

    await expect(handler.execute(query)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
