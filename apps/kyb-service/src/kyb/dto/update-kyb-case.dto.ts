import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { KybStatus } from '../models/kyb-case.model';

export class UpdateKybCaseDto {
  @ApiProperty({ example: 'approved', description: 'Status of review' })
  @IsNotEmpty()
  @IsIn([KybStatus.Approved, KybStatus.Rejected])
  status: KybStatus;
}
