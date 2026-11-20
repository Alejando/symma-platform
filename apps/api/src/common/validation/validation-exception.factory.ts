import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import type { TranslatableMessage } from '../i18n/translatable-message';

const KEY_BY_CONSTRAINT: Record<string, string> = {
  isNotEmpty: 'required',
  isDefined: 'required',
  isString: 'string',
  isInt: 'integer',
  isNumber: 'number',
  min: 'outOfRange',
  max: 'outOfRange',
  isUuid: 'uuid',
  isIso8601: 'date',
  isDateString: 'date',
  isEmail: 'email',
  isIn: 'oneOf',
  isEnum: 'oneOf',
  isUrl: 'url',
  matches: 'format',
  length: 'length',
  minLength: 'length',
  maxLength: 'length',
  isBoolean: 'boolean',
  isArray: 'array',
  arrayMinSize: 'minItems',
  isObject: 'object',
  isNumberRecord: 'numberMap',
  isOnOrAfter: 'notBefore',
};

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  return new BadRequestException({
    message: errors.flatMap((error) => messagesFor(error)),
    error: 'Bad Request',
  });
}

function messagesFor(
  error: ValidationError,
  parentPath = '',
): TranslatableMessage[] {
  const property = parentPath
    ? `${parentPath}.${error.property}`
    : error.property;

  const own = Object.keys(error.constraints ?? {}).map((constraint) => ({
    key: `errors.validation.${KEY_BY_CONSTRAINT[constraint] ?? 'invalid'}`,
    args: { property },
  }));

  const nested = (error.children ?? []).flatMap((child) =>
    messagesFor(child, property),
  );

  return [...own, ...nested];
}
