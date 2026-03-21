import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	CreateStatusUpdateDto,
	Department,
	Event,
	ResponderStatus,
	StatusUpdate,
	User,
} from '@emergensee/shared';
import { departmentsService } from 'services/departmentsService';
import { eventsService } from 'services/eventsService';
import { statusService } from 'services/statusService';
import { usersService } from 'services/usersService';

export const STATUS_PAGE_QUERY_KEYS = {
	events: ['events'] as const,
	departments: ['departments'] as const,
	users: ['users'] as const,
	status: ['status'] as const,
};

export function useStatusPageEventsQuery() {
	return useQuery<Event[]>({
		queryKey: STATUS_PAGE_QUERY_KEYS.events,
		queryFn: eventsService.getAll,
	});
}

export function useStatusPageDepartmentsQuery() {
	return useQuery<Department[]>({
		queryKey: STATUS_PAGE_QUERY_KEYS.departments,
		queryFn: departmentsService.getAll,
	});
}

export function useStatusPageUsersQuery() {
	return useQuery<User[]>({
		queryKey: STATUS_PAGE_QUERY_KEYS.users,
		queryFn: usersService.getAll,
	});
}

export function useStatusPageStatusUpdatesQuery() {
	return useQuery<StatusUpdate[]>({
		queryKey: STATUS_PAGE_QUERY_KEYS.status,
		queryFn: statusService.getAll,
	});
}

export function useStatusPageCreateStatusMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: { status: ResponderStatus; userId: string; eventId: string }) => {
			const payload: CreateStatusUpdateDto = {
				status: data.status,
				userId: data.userId,
				eventId: data.eventId,
			};
			return statusService.create(payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: STATUS_PAGE_QUERY_KEYS.status });
		},
	});
}
