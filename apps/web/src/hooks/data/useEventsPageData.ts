import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Event, UpdateEventDto } from '@emergensee/shared';
import { eventsService } from 'services/eventsService';
import { toast } from 'sonner';
import * as strings from './strings';

export const EVENTS_PAGE_QUERY_KEYS = {
	events: ['events'] as const,
};

export function useEventsPageQuery() {
	return useQuery({
		queryKey: EVENTS_PAGE_QUERY_KEYS.events,
		queryFn: eventsService.getAll,
	});
}

export function useEventsPageUpdateMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateEventDto | Partial<Event> }) =>
			eventsService.update(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: EVENTS_PAGE_QUERY_KEYS.events });
			toast.success(strings.eventUpdateSuccess);
		},
		onError: () => {
			toast.error(strings.eventUpdateError);
		},
	});
}
