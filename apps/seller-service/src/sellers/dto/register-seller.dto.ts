import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsSiret } from '../decorators/is-valid-siret.decorator';

export class RegisterSellerDto {
  @ApiProperty({ example: 'acme@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '73282932000074', description: '14 numeric digits' })
  @IsNotEmpty()
  @IsSiret()
  siret: string;

  @ApiProperty({ example: 'Acme Corp' })
  @IsNotEmpty()
  @IsString()
  companyName: string;
}
