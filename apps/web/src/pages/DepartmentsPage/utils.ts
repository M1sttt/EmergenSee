import { Department, User, UserRole } from '@emergensee/shared';
import { UserWithOptionalObjectId, getEntityId } from '@/types/entities';
import * as strings from './strings';

export const filterDepartments = (departments: Department[], searchQuery: string): Department[] => {
    if (!searchQuery.trim()) return departments;
    const lowerQuery = searchQuery.toLowerCase();
    return departments.filter(
        dep => dep.name.toLowerCase().includes(lowerQuery) || dep.description.toLowerCase().includes(lowerQuery),
    );
};

export const formatAdmins = (
	adminsIds: string[] | undefined,
	users: UserWithOptionalObjectId[],
): string => {
    if (!adminsIds?.length) return strings.noAdmins;

    return adminsIds
        .map(id => {
            const user = users.find(u => getEntityId(u) === id);
            return user ? `${user.firstName}(${id})` : `${strings.unknownAdmin}(${id})`;
        })
        .join(', ');
};

export const checkIsAdmin = (department: Department, currentUser: User | null): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    return !!department.admins?.includes(currentUser.id);
};
