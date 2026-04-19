import { describe, expect, it } from 'vitest';
import { AppError, BadRequestError, NotFoundError, UnauthorizedError } from '@/lib/errors';

describe('AppError', () => {
  it('sets statusCode and message', () => {
    const err = new AppError(422, 'Unprocessable');
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe('Unprocessable');
    expect(err.name).toBe('AppError');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('NotFoundError', () => {
  it('defaults to 404 and generic message', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Resource not found');
  });

  it('accepts a custom message', () => {
    const err = new NotFoundError('Lab result not found');
    expect(err.message).toBe('Lab result not found');
  });
});

describe('UnauthorizedError', () => {
  it('defaults to 401 and generic message', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });

  it('accepts a custom message', () => {
    const err = new UnauthorizedError('Token expired');
    expect(err.message).toBe('Token expired');
  });
});

describe('BadRequestError', () => {
  it('sets 400 status and the provided message', () => {
    const err = new BadRequestError('Email already registered');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Email already registered');
  });

  it('is an instance of AppError', () => {
    expect(new BadRequestError('x')).toBeInstanceOf(AppError);
  });
});
