import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
  fullName: z.string().min(2, 'Full name is required.'),
  businessName: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required.').trim(),
  password: z.string().min(1, 'Password is required.')
});
