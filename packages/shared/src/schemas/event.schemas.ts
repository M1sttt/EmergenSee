import { z } from 'zod';
import { EventType, EventPriority, EventStatus } from '../types/event.types';

export const eventTypeSchema = z.nativeEnum(EventType);
export const eventPrioritySchema = z.nativeEnum(EventPriority);
export const eventStatusSchema = z.nativeEnum(EventStatus);

export const locationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});

export const createEventSchema = z.object({
  type: eventTypeSchema,
  priority: eventPrioritySchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: locationSchema,
  reportedBy: z.string().optional(),
  departments: z.array(z.string()).min(1, 'At least one department is required'),
});

export const updateEventSchema = z.object({
  type: eventTypeSchema.optional(),
  priority: eventPrioritySchema.optional(),
  status: eventStatusSchema.optional(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  location: locationSchema.optional(),
  assignedTo: z.array(z.string()).optional(),
  resolvedAt: z.date().optional(),
  departments: z.array(z.string()).optional(),
});
