import { useQuery } from '@tanstack/react-query';
import { Event, StatusUpdate } from '@emergensee/shared';
import { eventsService } from 'services/eventsService';
import { statusService } from 'services/statusService';

export const LAYOUT_QUERY_KEYS = {
	events: ['events'] as const,
	status: ['status'] as const,
	userStatus: (userId: string) => ['status', userId] as const,
};

export function useLayoutEventsQuery() {
	return useQuery<Event[]>({
		queryKey: LAYOUT_QUERY_KEYS.events,
		queryFn: eventsService.getAll,
	});
}

export function useLayoutUserStatusesQuery(userId?: string) {
	return useQuery<StatusUpdate[]>({
		queryKey: userId ? LAYOUT_QUERY_KEYS.userStatus(userId) : [...LAYOUT_QUERY_KEYS.status, 'unknown'],
		queryFn: () => statusService.getByUser(userId!),
		enabled: !!userId,
	});
}
