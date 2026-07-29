import { Command } from '@nestjs/cqrs';
import { KybStatus } from '../models/kyb-case.model';

export class ReviewKybCommand extends Command<string> {
  constructor(
    public readonly id: string,
    public readonly status: KybStatus
) {
    super();
  }
}
