import { z } from 'zod';

export const createDepartmentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    admins: z.array(z.string()).optional(),
    subDepartments: z.array(z.string()).optional(),
});

export const updateDepartmentSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().min(1, 'Description is required').optional(),
    admins: z.array(z.string()).optional(),
    subDepartments: z.array(z.string()).optional(),
});