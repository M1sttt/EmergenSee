import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateEventDto, Department, Event, UpdateEventDto } from '@emergensee/shared';
import { departmentsService } from 'services/departmentsService';
import { eventsService } from 'services/eventsService';

export const EVENT_FORM_QUERY_KEYS = {
	departments: ['departments'] as const,
	events: ['events'] as const,
};

export function useEventFormDepartmentsQuery() {
	return useQuery<Department[]>({
		queryKey: EVENT_FORM_QUERY_KEYS.departments,
		queryFn: departmentsService.getAll,
	});
}

export function useEventFormCreateMutation(onSuccess: () => void) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateEventDto) => eventsService.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: EVENT_FORM_QUERY_KEYS.events });
			onSuccess();
		},
	});
}

export function useEventFormUpdateMutation(onSuccess: () => void) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateEventDto | Partial<Event> }) =>
			eventsService.update(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: EVENT_FORM_QUERY_KEYS.events });
			onSuccess();
		},
	});
}
