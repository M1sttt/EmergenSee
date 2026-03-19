import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Department, User } from '@emergensee/shared';
import { departmentsService } from 'services/departmentsService';
import { usersService } from 'services/usersService';

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
        },
    });
}
