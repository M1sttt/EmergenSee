import { useQuery } from '@tanstack/react-query';
import { Department, Event, StatusUpdate, User } from '@emergensee/shared';
import { departmentsService } from 'services/departmentsService';
import { eventsService } from 'services/eventsService';
import { statusService } from 'services/statusService';
import { usersService } from 'services/usersService';

export const EVENT_PREVIEW_MODAL_QUERY_KEYS = {
	events: ['events'] as const,
	departments: ['departments'] as const,
	users: ['users'] as const,
	status: ['status'] as const,
};

export function useEventPreviewModalEventsQuery() {
	return useQuery<Event[]>({
		queryKey: EVENT_PREVIEW_MODAL_QUERY_KEYS.events,
		queryFn: eventsService.getAll,
	});
}

export function useEventPreviewModalDepartmentsQuery() {
	return useQuery<Department[]>({
		queryKey: EVENT_PREVIEW_MODAL_QUERY_KEYS.departments,
		queryFn: departmentsService.getAll,
	});
}

export function useEventPreviewModalUsersQuery() {
	return useQuery<User[]>({
		queryKey: EVENT_PREVIEW_MODAL_QUERY_KEYS.users,
		queryFn: usersService.getAll,
	});
}

export function useEventPreviewModalStatusQuery() {
	return useQuery<StatusUpdate[]>({
		queryKey: EVENT_PREVIEW_MODAL_QUERY_KEYS.status,
		queryFn: statusService.getAll,
	});
}
