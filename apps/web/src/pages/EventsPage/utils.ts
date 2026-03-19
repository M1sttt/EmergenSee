import { Event, EventPriority, EventStatus } from '@emergensee/shared';
import * as consts from './consts';

export function getPriorityColor(priority: EventPriority): string {
	return consts.getPriorityColorClass(priority);
}

export function getStatusColor(status: EventStatus): string {
	return consts.getStatusColorClass(status);
}

export function getEventId(event: Event | (Event & { _id?: string })): string {
	const doc = event as Event & { _id?: string };
	return event.id || doc._id || '';
}
