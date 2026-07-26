import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import request from 'supertest';
import { SellersController } from '../src/sellers/sellers.controller';
import { RegisterSellerHandler } from '../src/sellers/commands/register-seller.handler';
import { GetSellerHandler } from '../src/sellers/queries/get-seller.handler';
import { SellerRepository } from '../src/sellers/repository/seller.repository';
import { SellerEventsPublisher } from '../src/sellers/events/seller-events.publisher';
import { Seller } from '../src/sellers/models/seller.model';

type MockedSellerRepository = jest.Mocked<
  Pick<SellerRepository, 'save' | 'findById'>
>;

type MockedSellerEventsPublisher = jest.Mocked<
  Pick<SellerEventsPublisher, 'publishSellerRegistered'>
>;

interface SellerResponseBody {
  id: string;
  companyName: string;
  email: string;
  siret: string;
  createdAt: string;
}

describe('Sellers (e2e)', () => {
  let app: INestApplication;
  let sellerRepository: MockedSellerRepository;
  let sellerEventsPublisher: MockedSellerEventsPublisher;

  beforeAll(async () => {
    sellerRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    sellerEventsPublisher = {
      publishSellerRegistered: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      controllers: [SellersController],
      providers: [
        RegisterSellerHandler,
        GetSellerHandler,
        { provide: SellerRepository, useValue: sellerRepository },
        { provide: SellerEventsPublisher, useValue: sellerEventsPublisher },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    sellerRepository.save.mockReset();
    sellerRepository.findById.mockReset();
    sellerEventsPublisher.publishSellerRegistered.mockReset();
  });

  describe('POST /sellers', () => {
    it('creates a seller and returns its id', async () => {
      sellerRepository.save.mockImplementation((seller) =>
        Promise.resolve(seller),
      );

      const response = await request(app.getHttpServer())
        .post('/sellers')
        .send({
          companyName: 'Acme Corp',
          email: 'acme@example.com',
          siret: '73282932000074',
        })
        .expect(201);

      const body = response.body as SellerResponseBody;
      expect(body.id).toEqual(expect.any(String));
      expect(sellerRepository.save).toHaveBeenCalledTimes(1);
    });

    it('rejects a SIRET that is not exactly 14 digits', async () => {
      await request(app.getHttpServer())
        .post('/sellers')
        .send({
          companyName: 'Acme Corp',
          email: 'acme@example.com',
          siret: '1234567890123',
        })
        .expect(400);

      expect(sellerRepository.save).not.toHaveBeenCalled();
    });

    it('rejects a payload with an unexpected extra field', async () => {
      await request(app.getHttpServer())
        .post('/sellers')
        .send({
          companyName: 'Acme Corp',
          email: 'acme@example.com',
          siret: '73282932000074',
          isAdmin: true,
        })
        .expect(400);
    });
  });

  describe('GET /sellers/:id', () => {
    it('returns the seller when it exists', async () => {
      const seller = new Seller(
        '145fd20c-9774-4ce7-a0fc-ef7e008faa2c',
        'Acme Corp',
        'acme@example.com',
        '73282932000074',
        new Date('2026-01-01T00:00:00.000Z'),
      );
      sellerRepository.findById.mockResolvedValue(seller);

      const response = await request(app.getHttpServer())
        .get(`/sellers/${seller.id}`)
        .expect(200);

      const body = response.body as SellerResponseBody;
      expect(body.id).toBe(seller.id);
      expect(body.companyName).toBe(seller.companyName);
    });

    it('returns 404 when the seller does not exist', async () => {
      sellerRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/sellers/unknown-id').expect(404);
    });
  });
});
