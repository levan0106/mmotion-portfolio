import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base exception for validation errors
 */
export class ValidationException extends HttpException {
  constructor(message: string, field?: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'Bad Request',
        details: field ? [{ field, message }] : [{ message }],
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Exception thrown when required field is missing
 */
export class RequiredFieldException extends ValidationException {
  constructor(field: string) {
    super(`${field} is required`, field);
  }
}

/**
 * Exception thrown when field value is too long
 */
export class FieldTooLongException extends ValidationException {
  constructor(field: string, value: string, maxLength: number) {
    super(`${field} is too long: ${value.length} characters. Maximum allowed: ${maxLength}`, field);
  }
}

/**
 * Exception thrown when field value is too short
 */
export class FieldTooShortException extends ValidationException {
  constructor(field: string, value: string, minLength: number) {
    super(`${field} is too short: ${value.length} characters. Minimum required: ${minLength}`, field);
  }
}

/**
 * Exception thrown when field value doesn't match pattern
 */
export class FieldPatternMismatchException extends ValidationException {
  constructor(field: string, value: string, pattern: string) {
    super(`${field} does not match required pattern: ${pattern}`, field);
  }
}

/**
 * Exception thrown when field value is not a valid UUID
 */
export class InvalidUuidException extends ValidationException {
  constructor(field: string, value: string) {
    super(`${field} is not a valid UUID: ${value}`, field);
  }
}

/**
 * Exception thrown when field value is not a valid date
 */
export class InvalidDateException extends ValidationException {
  constructor(field: string, value: string) {
    super(`${field} is not a valid date: ${value}`, field);
  }
}

/**
 * Exception thrown when field value is not a valid number
 */
export class InvalidNumberException extends ValidationException {
  constructor(field: string, value: string) {
    super(`${field} is not a valid number: ${value}`, field);
  }
}

/**
 * Exception thrown when field value is not a valid boolean
 */
export class InvalidBooleanException extends ValidationException {
  constructor(field: string, value: string) {
    super(`${field} is not a valid boolean: ${value}`, field);
  }
}

/**
 * Exception thrown when field value is not in allowed values
 */
export class InvalidEnumValueException extends ValidationException {
  constructor(field: string, value: string, allowedValues: string[]) {
    super(`${field} must be one of: ${allowedValues.join(', ')}. Got: ${value}`, field);
  }
}

/**
 * Exception thrown when field value is out of range
 */
export class FieldOutOfRangeException extends ValidationException {
  constructor(field: string, value: number, min?: number, max?: number) {
    let message = `${field} is out of range: ${value}`;
    if (min !== undefined && max !== undefined) {
      message += `. Must be between ${min} and ${max}`;
    } else if (min !== undefined) {
      message += `. Must be at least ${min}`;
    } else if (max !== undefined) {
      message += `. Must be at most ${max}`;
    }
    super(message, field);
  }
}

/**
 * Exception thrown when field value is negative when it should be positive
 */
export class NegativeValueException extends ValidationException {
  constructor(field: string, value: number) {
    super(`${field} must be positive. Got: ${value}`, field);
  }
}

/**
 * Exception thrown when field value is zero when it should be non-zero
 */
export class ZeroValueException extends ValidationException {
  constructor(field: string) {
    super(`${field} cannot be zero`, field);
  }
}

/**
 * Exception thrown when field value is empty when it should not be
 */
export class EmptyValueException extends ValidationException {
  constructor(field: string) {
    super(`${field} cannot be empty`, field);
  }
}

/**
 * Exception thrown when field value contains invalid characters
 */
export class InvalidCharactersException extends ValidationException {
  constructor(field: string, value: string, allowedCharacters: string) {
    super(`${field} contains invalid characters: ${value}. Allowed: ${allowedCharacters}`, field);
  }
}

/**
 * Exception thrown when field value is not a valid email
 */
export class InvalidEmailException extends ValidationException {
  constructor(field: string, value: string) {
    super(`${field} is not a valid email: ${value}`, field);
  }
}

/**
 * Exception thrown when field value is not a valid URL
 */
export class InvalidUrlException extends ValidationException {
  constructor(field: string, value: string) {
    super(`${field} is not a valid URL: ${value}`, field);
  }
}

/**
 * Exception thrown when field value is not a valid JSON
 */
export class InvalidJsonException extends ValidationException {
  constructor(field: string, value: string) {
    super(`${field} is not valid JSON: ${value}`, field);
  }
}

/**
 * Exception thrown when multiple validation errors occur
 */
export class MultipleValidationErrorsException extends ValidationException {
  constructor(errors: Array<{ field: string; message: string }>) {
    super(
      `Multiple validation errors: ${errors.map(e => `${e.field}: ${e.message}`).join(', ')}`,
    );
  }
}
