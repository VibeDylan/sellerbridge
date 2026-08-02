import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import request from 'supertest';
import { KybController } from '../src/kyb/kyb.controller';
import { ReviewKybHandler } from '../src/kyb/commands/review-kyb.handler';
import { KybCaseRepository } from '../src/kyb/repository/kyb-case.repository';
import { KybCaseEventsPublisher } from '../src/kyb/events/kyb-case-events.publisher';
import { KybCase, KybStatus } from '../src/kyb/models/kyb-case.model';

type MockedKybCaseRepository = jest.Mocked<
  Pick<KybCaseRepository, 'updateStatus'>
>;

type MockedKybCaseEventsPublisher = jest.Mocked<
  Pick<KybCaseEventsPublisher, 'publishKybReviewed'>
>;

describe('Kyb (e2e)', () => {
  let app: INestApplication;
  let kybCaseRepository: MockedKybCaseRepository;
  let kybCaseEventsPublisher: MockedKybCaseEventsPublisher;

  beforeAll(async () => {
    kybCaseRepository = {
      updateStatus: jest.fn(),
    };

    kybCaseEventsPublisher = {
      publishKybReviewed: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      controllers: [KybController],
      providers: [
        ReviewKybHandler,
        { provide: KybCaseRepository, useValue: kybCaseRepository },
        {
          provide: KybCaseEventsPublisher,
          useValue: kybCaseEventsPublisher,
        },
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
    kybCaseRepository.updateStatus.mockReset();
    kybCaseEventsPublisher.publishKybReviewed.mockReset();
  });

  describe('POST /kyb/:id/review', () => {
    it('reviews an existing case and returns its id', async () => {
      const updatedCase = new KybCase(
        'case-123',
        'seller-456',
        KybStatus.Approved,
        new Date('2026-01-01T00:00:00.000Z'),
        new Date(),
      );
      kybCaseRepository.updateStatus.mockResolvedValue(updatedCase);

      const response = await request(app.getHttpServer())
        .post('/kyb/case-123/review')
        .send({ status: 'approved' })
        .expect(201);

      const body = response.body as { reviewId: string };
      expect(body.reviewId).toBe('case-123');
      expect(kybCaseRepository.updateStatus).toHaveBeenCalledWith(
        'case-123',
        'approved',
      );
    });

    it('rejects a verdict that is not approved/rejected', async () => {
      await request(app.getHttpServer())
        .post('/kyb/case-123/review')
        .send({ status: 'pending' })
        .expect(400);

      expect(kybCaseRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('returns 404 when no case matches the id', async () => {
      kybCaseRepository.updateStatus.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/kyb/unknown-id/review')
        .send({ status: 'rejected' })
        .expect(404);
    });
  });
});
