import { Test } from '@nestjs/testing';
import { RegisterSellerHandler } from './register-seller.handler';
import { RegisterSellerCommand } from './register-seller.command';
import { SellerRepository } from '../repository/seller.repository';
import { Seller } from '../models/seller.model';
import { SellerEventsPublisher } from '../events/seller-events.publisher';

type MockedSellerRepository = jest.Mocked<
  Pick<SellerRepository, 'save' | 'findById'>
>;

type MockedSellerEventsPublisher = jest.Mocked<
  Pick<SellerEventsPublisher, 'publishSellerRegistered'>
>;

describe('RegisterSellerHandler', () => {
  let handler: RegisterSellerHandler;
  let sellerRepository: MockedSellerRepository;
  let sellerEventsPublisher: MockedSellerEventsPublisher;

  beforeEach(async () => {
    sellerRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    sellerEventsPublisher = {
      publishSellerRegistered: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RegisterSellerHandler,
        { provide: SellerRepository, useValue: sellerRepository },
        { provide: SellerEventsPublisher, useValue: sellerEventsPublisher },
      ],
    }).compile();

    handler = moduleRef.get(RegisterSellerHandler);
  });

  it('builds a Seller from the command, persists it, and returns its id', async () => {
    sellerRepository.save.mockImplementation((seller) =>
      Promise.resolve(seller),
    );

    const command = new RegisterSellerCommand(
      'Acme Corp',
      'acme@example.com',
      '73282932000074',
    );

    const id = await handler.execute(command);

    expect(sellerRepository.save).toHaveBeenCalledTimes(1);

    const savedSeller = sellerRepository.save.mock.calls[0][0];
    expect(savedSeller).toBeInstanceOf(Seller);
    expect(savedSeller.id).toBe(id);
    expect(savedSeller.companyName).toBe('Acme Corp');
    expect(savedSeller.email).toBe('acme@example.com');
    expect(savedSeller.siret).toBe('73282932000074');
    expect(savedSeller.createdAt).toBeInstanceOf(Date);

    expect(sellerEventsPublisher.publishSellerRegistered).toHaveBeenCalledWith(
      savedSeller,
    );
  });
});
