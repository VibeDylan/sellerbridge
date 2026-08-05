import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReviewKybBySellerHandler } from './review-kyb-by-seller.handler';
import { ReviewKybBySellerCommand } from './review-kyb-by-seller.command';
import { KybCaseRepository } from '../repository/kyb-case.repository';
import { KybCaseEventsPublisher } from '../events/kyb-case-events.publisher';
import { KybCase, KybStatus } from '../models/kyb-case.model';

type MockedKybCaseRepository = jest.Mocked<
  Pick<KybCaseRepository, 'updateStatusBySellerId'>
>;

type MockedKybCaseEventsPublisher = jest.Mocked<
  Pick<KybCaseEventsPublisher, 'publishKybReviewed'>
>;

describe('ReviewKybBySellerHandler', () => {
  let handler: ReviewKybBySellerHandler;
  let kybCaseRepository: MockedKybCaseRepository;
  let kybCaseEventsPublisher: MockedKybCaseEventsPublisher;

  beforeEach(async () => {
    kybCaseRepository = {
      updateStatusBySellerId: jest.fn(),
    };

    kybCaseEventsPublisher = {
      publishKybReviewed: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReviewKybBySellerHandler,
        { provide: KybCaseRepository, useValue: kybCaseRepository },
        {
          provide: KybCaseEventsPublisher,
          useValue: kybCaseEventsPublisher,
        },
      ],
    }).compile();

    handler = moduleRef.get(ReviewKybBySellerHandler);
  });

  it('updates the case status by sellerId, publishes kyb.reviewed, and returns the case id', async () => {
    const updatedCase = new KybCase(
      'case-123',
      'seller-456',
      KybStatus.Approved,
      new Date('2026-01-01T00:00:00.000Z'),
      new Date(),
    );
    kybCaseRepository.updateStatusBySellerId.mockResolvedValue(updatedCase);

    const command = new ReviewKybBySellerCommand(
      'seller-456',
      KybStatus.Approved,
    );
    const id = await handler.execute(command);

    expect(kybCaseRepository.updateStatusBySellerId).toHaveBeenCalledWith(
      'seller-456',
      KybStatus.Approved,
    );
    expect(kybCaseEventsPublisher.publishKybReviewed).toHaveBeenCalledWith(
      updatedCase,
    );
    expect(id).toBe('case-123');
  });

  it('throws NotFoundException when no case matches the sellerId', async () => {
    kybCaseRepository.updateStatusBySellerId.mockResolvedValue(null);

    const command = new ReviewKybBySellerCommand(
      'unknown-seller',
      KybStatus.Rejected,
    );

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
