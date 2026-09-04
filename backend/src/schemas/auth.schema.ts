import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({
      message: 'Name is required',
    })
    .min(2, 'Name must be at least 2 characters'),
  email: z.string({ message: 'Email is required' }).email('Invalid email address'),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Invalid email address'),
  password: z.string({ message: 'Password is required' }).min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
