import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService } from 'services/eventsService';
import { Event } from '@emergensee/shared';

export const EVENTS_QUERY_KEYS = {
	all: ['events'] as const,
	detail: (id: string) => ['events', id] as const,
};

export function useEvents(options?: any) {
	return useQuery({
		queryKey: EVENTS_QUERY_KEYS.all,
		queryFn: eventsService.getAll,
		...options,
	});
}

export function useUpdateEvent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) => eventsService.update(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all });
		},
	});
}

export function useCreateEvent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Partial<Event>) => eventsService.create(data as any),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all });
		},
	});
}
