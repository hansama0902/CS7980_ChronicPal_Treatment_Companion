import { describe, expect, it } from 'vitest';
import { LoginSchema, RegisterSchema } from '@/validators/authValidator';

describe('RegisterSchema', () => {
  it('accepts a valid email and password', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass1!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = RegisterSchema.safeParse({ email: 'not-an-email', password: 'SecurePass1!' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/valid email/);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = RegisterSchema.safeParse({ email: 'user@example.com', password: 'abc' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/8 characters/);
  });

  it('rejects a password longer than 72 characters', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      password: 'a'.repeat(73),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/72/);
  });

  it('accepts a password exactly 8 characters long', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      password: '12345678',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a password exactly 72 characters long', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@example.com',
      password: 'a'.repeat(72),
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = RegisterSchema.safeParse({ password: 'SecurePass1!' });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = RegisterSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('accepts a valid email and password', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: 'any' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = LoginSchema.safeParse({ email: 'bad-email', password: 'any' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/required/);
  });

  it('accepts a single-character password (only length ≥ 1 required)', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: 'x' });
    expect(result.success).toBe(true);
  });
});
