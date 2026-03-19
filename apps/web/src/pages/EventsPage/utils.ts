import { Event, EventPriority, EventStatus } from '@emergensee/shared';
import { getEventPriorityTone, getEventStatusTone } from '@/consts/ui';

export function getPriorityTone(priority: EventPriority) {
	return getEventPriorityTone(priority);
}

export function getStatusTone(status: EventStatus) {
	return getEventStatusTone(status);
}

export function getEventId(event: Event | (Event & { _id?: string })): string {
	const doc = event as Event & { _id?: string };
	return event.id || doc._id || '';
}
