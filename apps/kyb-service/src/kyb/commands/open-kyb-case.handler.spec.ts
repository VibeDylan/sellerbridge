import { Test } from '@nestjs/testing';
import { OpenKybCaseHandler } from './open-kyb-case.handler';
import { OpenKybCaseCommand } from './open-kyb-case.command';
import { KybCaseRepository } from '../repository/kyb-case.repository';
import { KybCase, KybStatus } from '../models/kyb-case.model';

type MockedKybCaseRepository = jest.Mocked<
  Pick<KybCaseRepository, 'save' | 'findBySellerId'>
>;

describe('OpenKybCaseHandler', () => {
  let handler: OpenKybCaseHandler;
  let kybCaseRepository: MockedKybCaseRepository;

  beforeEach(async () => {
    kybCaseRepository = {
      save: jest.fn(),
      findBySellerId: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OpenKybCaseHandler,
        { provide: KybCaseRepository, useValue: kybCaseRepository },
      ],
    }).compile();

    handler = moduleRef.get(OpenKybCaseHandler);
  });

  it('opens a new PENDING case when none exists for the seller', async () => {
    kybCaseRepository.findBySellerId.mockResolvedValue(null);
    kybCaseRepository.save.mockImplementation((kybCase) =>
      Promise.resolve(kybCase),
    );

    const command = new OpenKybCaseCommand('seller-123');
    const id = await handler.execute(command);

    expect(kybCaseRepository.findBySellerId).toHaveBeenCalledWith('seller-123');
    expect(kybCaseRepository.save).toHaveBeenCalledTimes(1);

    const savedCase = kybCaseRepository.save.mock.calls[0][0];
    expect(savedCase).toBeInstanceOf(KybCase);
    expect(savedCase.id).toBe(id);
    expect(savedCase.sellerId).toBe('seller-123');
    expect(savedCase.status).toBe(KybStatus.Pending);
    expect(savedCase.createdAt).toBeInstanceOf(Date);
    expect(savedCase.updatedAt).toEqual(savedCase.createdAt);
  });

  it('does not create a duplicate case when one already exists (idempotency)', async () => {
    const existingCase = new KybCase(
      'existing-case-id',
      'seller-123',
      KybStatus.Pending,
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    kybCaseRepository.findBySellerId.mockResolvedValue(existingCase);

    const command = new OpenKybCaseCommand('seller-123');
    const id = await handler.execute(command);

    expect(id).toBe('existing-case-id');
    expect(kybCaseRepository.save).not.toHaveBeenCalled();
  });
});
