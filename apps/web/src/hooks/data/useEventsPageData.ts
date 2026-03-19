import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Event, UpdateEventDto } from '@emergensee/shared';
import { eventsService } from 'services/eventsService';

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
        },
    });
}
