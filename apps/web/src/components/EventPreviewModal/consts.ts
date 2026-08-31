import { EventPriority, EventType } from '@emergensee/shared';

export const dateTimeFormat = 'MMM d, yyyy · HH:mm';
export const allAttendantsFilter = 'all';

export const eventTypeEmoji: Record<EventType, string> = {
	[EventType.FIRE]: '🔥',
	[EventType.MEDICAL]: '🚑',
	[EventType.ACCIDENT]: '💥',
	[EventType.CRIME]: '🚔',
	[EventType.NATURAL_DISASTER]: '🌪',
	[EventType.HAZMAT]: '☣️',
	[EventType.MISSILE_ATTACK]: '🚀',
	[EventType.OTHER]: '⚠️',
};

export const priorityHeaderGradient: Record<EventPriority, string> = {
	[EventPriority.CRITICAL]: 'from-red-700 via-red-600 to-rose-500',
	[EventPriority.HIGH]: 'from-orange-700 via-orange-600 to-amber-500',
	[EventPriority.MEDIUM]: 'from-amber-600 via-amber-500 to-yellow-400',
	[EventPriority.LOW]: 'from-emerald-700 via-emerald-600 to-green-500',
};
