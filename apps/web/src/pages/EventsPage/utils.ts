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

export type SortField = 'type' | 'priority' | 'status' | 'title' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<EventPriority, number> = {
	[EventPriority.CRITICAL]: 0,
	[EventPriority.HIGH]: 1,
	[EventPriority.MEDIUM]: 2,
	[EventPriority.LOW]: 3,
};

const STATUS_ORDER: Record<EventStatus, number> = {
	[EventStatus.ONGOING]: 0,
	[EventStatus.CANCELLED]: 1,
	[EventStatus.RESOLVED]: 2,
};

export function filterEvents(
	events: Event[],
	search: string,
	filterType: string,
	filterPriority: string,
	filterStatus: string,
): Event[] {
	return events.filter(e => {
		if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
		if (filterType && e.type !== filterType) return false;
		if (filterPriority && e.priority !== filterPriority) return false;
		if (filterStatus && e.status !== filterStatus) return false;
		return true;
	});
}

export function sortEvents(events: Event[], field: SortField | null, dir: SortDir): Event[] {
	return [...events].sort((a, b) => {
		// Always sort ongoing events above resolved/cancelled first
		const statusCmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
		if (statusCmp !== 0) return statusCmp;

		// If user selected a sort field, apply it within each status group
		if (field) {
			let cmp = 0;
			if (field === 'priority') {
				cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
			} else if (field === 'status') {
				cmp = 0; // already sorted by status above
			} else if (field === 'type') {
				cmp = a.type.localeCompare(b.type);
			} else if (field === 'title') {
				cmp = a.title.localeCompare(b.title);
			} else if (field === 'updatedAt') {
				cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
			}
			if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
		}

		// Default: newest first (createdAt descending)
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});
}
