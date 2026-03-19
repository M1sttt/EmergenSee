import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '@emergensee/shared';
import { usersService } from 'services/usersService';
import * as consts from '@/components/DepartmentMembersModal/consts';
import * as utils from '@/components/DepartmentMembersModal/utils';

export const DEPARTMENT_MEMBERS_MODAL_QUERY_KEYS = {
    users: ['users'] as const,
};

export function useDepartmentMembersModalUsersQuery() {
    return useQuery<User[]>({
        queryKey: DEPARTMENT_MEMBERS_MODAL_QUERY_KEYS.users,
        queryFn: usersService.getAll,
    });
}

export function useDepartmentMembersModalUpdateMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            selectedUserIds: Set<string>;
            users: User[];
            departmentId: string;
            activeTab: typeof consts.addTab | typeof consts.removeTab;
        }) => {
            const promises = Array.from(params.selectedUserIds).map(userId => {
                const user = params.users.find(u => u.id === userId);
                if (!user) return Promise.resolve();

                const updatedDepartments = utils.getUpdatedDepartments(
                    user.departments,
                    params.departmentId,
                    params.activeTab,
                );
                return usersService.update(userId, { departments: updatedDepartments });
            });
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DEPARTMENT_MEMBERS_MODAL_QUERY_KEYS.users });
        },
    });
}
