import { EventPriority, EventStatus } from '@emergensee/shared';

export const EVENTS_QUERY_KEY = 'events';

export const PRIORITY_COLORS: Record<EventPriority, string> = {
	[EventPriority.CRITICAL]: 'bg-red-100 text-red-800',
	[EventPriority.HIGH]: 'bg-orange-100 text-orange-800',
	[EventPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
	[EventPriority.LOW]: 'bg-green-100 text-green-800',
};

export const STATUS_COLORS: Record<EventStatus, string> = {
	[EventStatus.ONGOING]: 'bg-blue-100 text-blue-800',
	[EventStatus.RESOLVED]: 'bg-green-100 text-green-800',
	[EventStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

export const DEFAULT_PRIORITY_COLOR = 'bg-gray-100 text-gray-800';
export const DEFAULT_STATUS_COLOR = 'bg-gray-100 text-gray-800';
