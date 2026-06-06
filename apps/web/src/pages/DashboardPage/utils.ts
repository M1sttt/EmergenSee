import { EventStatus, EventPriority, Event, StatusUpdate, ResponderStatus } from '@emergensee/shared';

export const getActiveEventsCount = (events: Event[]): number =>
	events.filter(e => e.status !== EventStatus.RESOLVED && e.status !== EventStatus.CANCELLED).length;

export const getEventsByPriorityCount = (events: Event[], priority: EventPriority): number =>
	events.filter(e => e.priority === priority).length;

export interface StatusBreakdown {
	safe: number;
	needHelp: number;
	away: number;
	unknown: number;
	total: number;
	activeEventCount: number;
}

const extractId = (ref: unknown): string => {
	if (!ref) return '';
	if (typeof ref === 'string') return ref;
	const r = ref as Record<string, unknown>;
	return (r['id'] as string) || (r['_id'] as string) || '';
};

export const getStatusBreakdown = (statusUpdates: StatusUpdate[], events: Event[]): StatusBreakdown => {
	const activeEventIds = new Set(
		events
			.filter(e => e.status === EventStatus.ONGOING)
			.map(e => e.id),
	);

	if (activeEventIds.size === 0) {
		return { safe: 0, needHelp: 0, away: 0, unknown: 0, total: 0, activeEventCount: 0 };
	}

	// Keep only updates that belong to an active event
	const activeUpdates = statusUpdates.filter(su =>
		activeEventIds.has(extractId(su.eventId)),
	);

	// Per user: keep the most recent update only
	const latestByUser = new Map<string, StatusUpdate>();
	for (const su of activeUpdates) {
		const uid = extractId(su.userId);
		if (!uid) continue;
		const existing = latestByUser.get(uid);
		if (!existing || new Date(su.createdAt) > new Date(existing.createdAt)) {
			latestByUser.set(uid, su);
		}
	}

	let safe = 0, needHelp = 0, away = 0, unknown = 0;
	for (const su of latestByUser.values()) {
		switch (su.status) {
			case ResponderStatus.SAFE: safe++; break;
			case ResponderStatus.NEED_HELP: needHelp++; break;
			case ResponderStatus.AWAY: away++; break;
			default: unknown++;
		}
	}

	return { safe, needHelp, away, unknown, total: latestByUser.size, activeEventCount: activeEventIds.size };
};
