import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReviewKybHandler } from './review-kyb.handler';
import { ReviewKybCommand } from './review-kyb.command';
import { KybCaseRepository } from '../repository/kyb-case.repository';
import { KybCaseEventsPublisher } from '../events/kyb-case-events.publisher';
import { KybCase, KybStatus } from '../models/kyb-case.model';

type MockedKybCaseRepository = jest.Mocked<
  Pick<KybCaseRepository, 'updateStatus'>
>;

type MockedKybCaseEventsPublisher = jest.Mocked<
  Pick<KybCaseEventsPublisher, 'publishKybReviewed'>
>;

describe('ReviewKybHandler', () => {
  let handler: ReviewKybHandler;
  let kybCaseRepository: MockedKybCaseRepository;
  let kybCaseEventsPublisher: MockedKybCaseEventsPublisher;

  beforeEach(async () => {
    kybCaseRepository = {
      updateStatus: jest.fn(),
    };

    kybCaseEventsPublisher = {
      publishKybReviewed: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReviewKybHandler,
        { provide: KybCaseRepository, useValue: kybCaseRepository },
        {
          provide: KybCaseEventsPublisher,
          useValue: kybCaseEventsPublisher,
        },
      ],
    }).compile();

    handler = moduleRef.get(ReviewKybHandler);
  });

  it('updates the case status, publishes kyb.reviewed, and returns its id when the case exists', async () => {
    const updatedCase = new KybCase(
      'case-123',
      'seller-456',
      KybStatus.Approved,
      new Date('2026-01-01T00:00:00.000Z'),
      new Date(),
    );
    kybCaseRepository.updateStatus.mockResolvedValue(updatedCase);

    const command = new ReviewKybCommand('case-123', KybStatus.Approved);
    const id = await handler.execute(command);

    expect(kybCaseRepository.updateStatus).toHaveBeenCalledWith(
      'case-123',
      KybStatus.Approved,
    );
    expect(kybCaseEventsPublisher.publishKybReviewed).toHaveBeenCalledWith(
      updatedCase,
    );
    expect(id).toBe('case-123');
  });

  it('throws NotFoundException when no case matches the id', async () => {
    kybCaseRepository.updateStatus.mockResolvedValue(null);

    const command = new ReviewKybCommand('unknown-id', KybStatus.Rejected);

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
