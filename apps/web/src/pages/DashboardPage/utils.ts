import { EventStatus, EventPriority, Event } from '@emergensee/shared';

export const getActiveEventsCount = (events: Event[]): number =>
	events.filter(e => e.status !== EventStatus.RESOLVED && e.status !== EventStatus.CANCELLED).length;

export const getEventsByPriorityCount = (events: Event[], priority: EventPriority): number =>
	events.filter(e => e.priority === priority).length;
