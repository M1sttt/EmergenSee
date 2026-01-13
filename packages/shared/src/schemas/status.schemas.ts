import { z } from 'zod';
import { ResponderStatus } from '../types/status.types';

export const responderStatusSchema = z.nativeEnum(ResponderStatus);

export const responderLocationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});

export const createStatusUpdateSchema = z.object({
  status: responderStatusSchema,
  location: responderLocationSchema.optional(),
  eventId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateStatusUpdateSchema = z.object({
  status: responderStatusSchema.optional(),
  location: responderLocationSchema.optional(),
  eventId: z.string().optional(),
  notes: z.string().optional(),
});
