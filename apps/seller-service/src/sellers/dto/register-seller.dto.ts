import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsSiret } from '../decorators/is-valid-siret.decorator';

/**
*   Ici je fait une assignation définitive suite a un problème avec mon éditeur qui m'indique
*   une erreur non existante sur mes variables.
*/

export class RegisterSellerDto {
  @ApiProperty({ example: 'acme@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '73282932000074', description: '14 numeric digits' })
  @IsNotEmpty()
  @IsSiret()
  siret!: string;

  @ApiProperty({ example: 'Acme Corp' })
  @IsNotEmpty()
  @IsString()
  companyName!: string;
}