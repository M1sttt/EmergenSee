import { EventPriority } from '@emergensee/shared';

export const RECENT_ITEMS_LIMIT = 5;

export const QUERY_KEYS = {
	EVENTS: ['events'],
	STATUS: ['status'],
} as const;

export const PRIORITY_STYLES: Record<EventPriority, string> = {
	[EventPriority.CRITICAL]: 'bg-red-100 text-red-800',
	[EventPriority.HIGH]: 'bg-orange-100 text-orange-800',
	[EventPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
	[EventPriority.LOW]: 'bg-green-100 text-green-800',
};

export const COMMON_STATUS_STYLE = 'px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800';
