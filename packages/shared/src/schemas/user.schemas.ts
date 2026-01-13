import { z } from 'zod';
import { UserRole, UserStatus } from '../types/user.types';

export const userRoleSchema = z.nativeEnum(UserRole);
export const userStatusSchema = z.nativeEnum(UserStatus);

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: userRoleSchema,
  phoneNumber: z.string().optional(),
  badgeNumber: z.string().optional(),
  department: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  phoneNumber: z.string().optional(),
  badgeNumber: z.string().optional(),
  department: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
