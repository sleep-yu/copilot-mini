export class ValidateError extends Error {
  public field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
    this.name = 'ValidateError';
  }

  static isValidateError(error: unknown): error is ValidateError {
    return error instanceof ValidateError;
  }

  static create(message: string, field?: string) {
    return new ValidateError(message, field);
  }
}
