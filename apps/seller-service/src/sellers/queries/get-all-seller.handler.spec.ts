import { Test } from '@nestjs/testing';
import { GetAllSellerHandler } from './get-all-seller.handler';
import { SellerRepository } from '../repository/seller.repository';
import { Seller, SellerKybStatus } from '../models/seller.model';

type MockedSellerRepository = jest.Mocked<Pick<SellerRepository, 'findAll'>>;

describe('GetAllSellerHandler', () => {
  let handler: GetAllSellerHandler;
  let sellerRepository: MockedSellerRepository;

  beforeEach(async () => {
    sellerRepository = {
      findAll: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetAllSellerHandler,
        { provide: SellerRepository, useValue: sellerRepository },
      ],
    }).compile();

    handler = moduleRef.get(GetAllSellerHandler);
  });

  it('returns every seller from the repository', async () => {
    const sellers = [
      new Seller(
        'seller-1',
        'Acme Corp',
        'acme@example.com',
        '73282932000074',
        new Date(),
        SellerKybStatus.Pending,
      ),
      new Seller(
        'seller-2',
        'Widget Co',
        'widget@example.com',
        '73282932000074',
        new Date(),
        SellerKybStatus.Approved,
      ),
    ];
    sellerRepository.findAll.mockResolvedValue(sellers);

    const result = await handler.execute();

    expect(result).toBe(sellers);
  });

  it('returns an empty array when there are no sellers, not an error', async () => {
    sellerRepository.findAll.mockResolvedValue([]);

    const result = await handler.execute();

    expect(result).toEqual([]);
  });
});
