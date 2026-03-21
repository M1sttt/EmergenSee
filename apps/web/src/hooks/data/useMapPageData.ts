import { useQuery } from '@tanstack/react-query';
import { Event } from '@emergensee/shared';
import { eventsService } from 'services/eventsService';

export const MAP_PAGE_QUERY_KEYS = {
	events: ['events'] as const,
};

export function useMapPageEventsQuery() {
	return useQuery<Event[]>({
		queryKey: MAP_PAGE_QUERY_KEYS.events,
		queryFn: eventsService.getAll,
	});
}
