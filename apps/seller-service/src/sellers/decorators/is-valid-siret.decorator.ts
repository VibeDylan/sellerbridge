import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function isValidSiret(siret: string): boolean {
  if (!/^\d{14}$/.test(siret)) {
    return false;
  }

  let sum = 0;

  for (let i = 0; i < siret.length; i++) {
    let digit = Number(siret[i]);

    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

export function IsSiret(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSiret',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidSiret(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is not a valid siret`;
        },
      },
    });
  };
}