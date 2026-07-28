import { Command } from '@nestjs/cqrs';

export class OpenKybCaseCommand extends Command<string> {
  constructor(public readonly sellerId: string) {
    super();
  }
}
