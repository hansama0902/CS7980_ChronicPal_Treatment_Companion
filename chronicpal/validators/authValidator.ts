import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email({ message: 'email must be a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'password must be at least 8 characters' })
    .max(72, { message: 'password must be ≤ 72 characters' }),
  role: z.enum(['PATIENT', 'CAREGIVER']).default('PATIENT'),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: 'email must be a valid email address' }),
  password: z.string().min(1, { message: 'password is required' }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
