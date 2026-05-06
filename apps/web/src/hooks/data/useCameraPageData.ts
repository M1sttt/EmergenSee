import { useMutation, useQuery } from '@tanstack/react-query';
import { CreateStatusUpdateDto, Event, ResponderStatus, User } from '@emergensee/shared';
import { eventsService } from 'services/eventsService';
import { statusService } from 'services/statusService';
import { usersService } from 'services/usersService';
import { toast } from 'sonner';
import * as strings from './strings';

export const CAMERA_QUERY_KEYS = {
	users: ['users'] as const,
	events: ['events'] as const,
};

export function useCameraUsersQuery() {
	return useQuery<User[]>({
		queryKey: CAMERA_QUERY_KEYS.users,
		queryFn: usersService.getAll,
	});
}

export function useCameraEventsQuery() {
	return useQuery<Event[]>({
		queryKey: CAMERA_QUERY_KEYS.events,
		queryFn: eventsService.getAll,
	});
}

export function useCameraStatusMutation(onSuccess?: (userId: string) => void) {
	return useMutation({
		mutationFn: (payload: CreateStatusUpdateDto) => statusService.create(payload),
		onSuccess: (_, variables) => {
			onSuccess?.(variables.userId ?? '');
			toast.success(strings.statusReportSuccess);
		},
		onError: () => {
			toast.error(strings.statusReportError);
		},
	});
}

export type { ResponderStatus };
