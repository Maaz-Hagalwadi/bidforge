import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Please enter a valid phone number'),
  role: z.enum(['CLIENT', 'FREELANCER']),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const postJobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  budgetMin: z.coerce.number({ invalid_type_error: 'Enter a number' }).positive('Must be > 0'),
  budgetMax: z.coerce.number({ invalid_type_error: 'Enter a number' }).positive('Must be > 0'),
  deadline: z.string().optional().refine(
    val => !val || new Date(val) >= new Date(new Date().toDateString()),
    { message: 'Deadline cannot be in the past' }
  ),
  attachmentUrl: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'INVITE_ONLY']),
  experienceLevel: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).optional(),
  urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH'], { errorMap: () => ({ message: 'Please select an urgency level' }) }),
}).refine(d => d.budgetMax >= d.budgetMin, {
  message: 'Max must be ≥ min',
  path: ['budgetMax'],
});

export type PostJobFormValues = z.infer<typeof postJobSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
