import { EventStatus, EventPriority, Event, StatusUpdate, ResponderStatus, User } from '@emergensee/shared';
import { getEntityId, getReferenceName, toDate } from '@/types/entities';
import * as strings from './strings';

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

export const getStatusBreakdown = (statusUpdates: StatusUpdate[], events: Event[]): StatusBreakdown => {
	const activeEventIds = new Set(
		events
			.filter(e => e.status === EventStatus.ONGOING)
			.map(e => e.id),
	);

	if (activeEventIds.size === 0) {
		return { safe: 0, needHelp: 0, away: 0, unknown: 0, total: 0, activeEventCount: 0 };
	}

	const activeUpdates = statusUpdates.filter(su =>
		activeEventIds.has(getEntityId(su.eventId)),
	);

	const latestByUser = new Map<string, StatusUpdate>();
	for (const su of activeUpdates) {
		const uid = getEntityId(su.userId);
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

export interface RecentStatusUpdateItem {
	id: string;
	userId: string;
	userName: string;
	eventId: string;
	eventTitle: string;
	status: ResponderStatus;
	createdAt: Date;
}

export const buildRecentStatusUpdates = (
	statusUpdates: StatusUpdate[],
	users: User[],
	events: Event[],
	limit: number,
): RecentStatusUpdateItem[] => {
	const userNameById = new Map(users.map(user => [getEntityId(user), `${user.firstName} ${user.lastName}`.trim()]));
	const eventTitleById = new Map(events.map(event => [getEntityId(event), event.title]));

	return [...statusUpdates]
		.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
		.slice(0, limit)
		.map(statusUpdate => {
			const userId = getEntityId(statusUpdate.userId);
			const eventId = getEntityId(statusUpdate.eventId);
			return {
				id: getEntityId(statusUpdate) || `${userId}-${toDate(statusUpdate.createdAt).getTime()}`,
				userId,
				userName: userNameById.get(userId) || getReferenceName(statusUpdate.userId) || strings.unknownUser,
				eventId,
				eventTitle: eventTitleById.get(eventId) || getReferenceName(statusUpdate.eventId) || strings.unknownEvent,
				status: statusUpdate.status,
				createdAt: toDate(statusUpdate.createdAt),
			};
		});
};
