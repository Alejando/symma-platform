import { ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

// Example custom decorator using nestjs-i18n validation messages
export function IsValidDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidDate',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: i18nValidationMessage('validation.date'),
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          return value instanceof Date || !isNaN(Date.parse(value));
        },
      },
    });
  };
}
