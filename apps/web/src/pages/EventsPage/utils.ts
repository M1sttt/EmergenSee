import { Event, EventPriority, EventStatus } from '@emergensee/shared';
import { PRIORITY_COLORS, STATUS_COLORS, DEFAULT_PRIORITY_COLOR, DEFAULT_STATUS_COLOR } from './consts';

export function getPriorityColor(priority: EventPriority): string {
	return PRIORITY_COLORS[priority] || DEFAULT_PRIORITY_COLOR;
}

export function getStatusColor(status: EventStatus): string {
	return STATUS_COLORS[status] || DEFAULT_STATUS_COLOR;
}

export function getEventId(event: Event | (Event & { _id?: string })): string {
	const doc = event as Event & { _id?: string };
	return event.id || doc._id || '';
}
