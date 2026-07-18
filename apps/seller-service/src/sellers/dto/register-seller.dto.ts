import { IsEmail, IsString } from 'class-validator';
import { IsSiret } from '../decorators/is-valid-siret.decorator';

/**
 *   Ici je fait une assignation définitive suite a un problème avec mon éditeur qui m'indique 
*.    une erreur non existante sur mes variables.
*/

export class RegisterSellerDto {
  @IsEmail()
  email!: string;

  @IsSiret()
  siret!: string;

  @IsString()
  companyName!: string;
}