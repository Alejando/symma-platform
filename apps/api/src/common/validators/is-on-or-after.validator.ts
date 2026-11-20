import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsOnOrAfter(
  otherProperty: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isOnOrAfter',
      target: object.constructor,
      propertyName,
      constraints: [otherProperty],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const other = (args.object as Record<string, unknown>)[otherProperty];
          if (typeof value !== 'string' || typeof other !== 'string') {
            return false;
          }
          return Date.parse(value) >= Date.parse(other);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not be before ${otherProperty}`;
        },
      },
    });
  };
}
