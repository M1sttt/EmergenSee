import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateUserDto, Department, UpdateUserDto } from '@emergensee/shared';
import { departmentsService } from 'services/departmentsService';
import { usersService } from 'services/usersService';

export const USER_FORM_QUERY_KEYS = {
    departments: ['departments'] as const,
    users: ['users'] as const,
};

export function useUserFormDepartmentsQuery() {
    return useQuery<Department[]>({
        queryKey: USER_FORM_QUERY_KEYS.departments,
        queryFn: departmentsService.getAll,
    });
}

export function useUserFormCreateMutation(onSuccess: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserDto) => usersService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_FORM_QUERY_KEYS.users });
            onSuccess();
        },
    });
}

export function useUserFormUpdateMutation(onSuccess: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) => usersService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_FORM_QUERY_KEYS.users });
            onSuccess();
        },
    });
}
