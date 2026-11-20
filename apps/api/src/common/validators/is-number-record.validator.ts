import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsNumberRecord(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNumberRecord',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            Object.values(value).every(
              (entry) => typeof entry === 'number' && Number.isFinite(entry),
            )
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must map names to finite numbers`;
        },
      },
    });
  };
}
