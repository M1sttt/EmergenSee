import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Department, User } from '@emergensee/shared';
import { departmentsService } from 'services/departmentsService';
import { usersService } from 'services/usersService';
import { toast } from 'sonner';
import * as strings from './strings';

export const DEPARTMENTS_PAGE_QUERY_KEYS = {
	departments: ['departments'] as const,
	users: ['users'] as const,
};

export function useDepartmentsPageDepartmentsQuery() {
	return useQuery<Department[]>({
		queryKey: DEPARTMENTS_PAGE_QUERY_KEYS.departments,
		queryFn: departmentsService.getAll,
	});
}

export function useDepartmentsPageUsersQuery() {
	return useQuery<User[]>({
		queryKey: DEPARTMENTS_PAGE_QUERY_KEYS.users,
		queryFn: usersService.getAll,
	});
}

export function useDepartmentsPageDeleteMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => departmentsService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: DEPARTMENTS_PAGE_QUERY_KEYS.departments });
			toast.success(strings.departmentDeleteSuccess);
		},
		onError: () => {
			toast.error(strings.departmentDeleteError);
		},
	});
}
