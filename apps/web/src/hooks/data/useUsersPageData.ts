import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Department, User } from '@emergensee/shared';
import { departmentsService } from 'services/departmentsService';
import { usersService } from 'services/usersService';
import { faceRecognitionService } from 'services/faceRecognitionService';
import { toast } from 'sonner';
import * as strings from './strings';

export const USERS_PAGE_QUERY_KEYS = {
	users: ['users'] as const,
	departments: ['departments'] as const,
};

export function useUsersPageUsersQuery() {
	return useQuery<User[]>({
		queryKey: USERS_PAGE_QUERY_KEYS.users,
		queryFn: usersService.getAll,
	});
}

export function useUsersPageDepartmentsQuery() {
	return useQuery<Department[]>({
		queryKey: USERS_PAGE_QUERY_KEYS.departments,
		queryFn: departmentsService.getAll,
	});
}

export function useUsersPageDeleteUserMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => usersService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: USERS_PAGE_QUERY_KEYS.users });
			toast.success(strings.userDeleteSuccess);
		},
		onError: () => {
			toast.error(strings.userDeleteError);
		},
	});
}

export function useFaceRegistrationMutation(onSuccess: () => void) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ user, blob }: { user: User; blob: Blob }) => {
			const result = await faceRecognitionService.register(
				user.id,
				blob,
			);
			await usersService.update(user.id, { faceIdentity: result.registered_as });
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: USERS_PAGE_QUERY_KEYS.users });
			onSuccess();
		},
		onError: () => {
			toast.error(strings.userUpdateError);
		},
	});
}
