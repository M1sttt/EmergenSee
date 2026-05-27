import { UserRole, UserStatus, Department } from '@emergensee/shared';
import { getUserStatusTone } from '@/consts/ui';
import { UserWithOptionalObjectId, getEntityId } from '@/types/entities';
import * as consts from './consts';

export const isGlobalAdmin = (userRole?: UserRole): boolean => userRole === UserRole.ADMIN;

export const getAdminDepartments = (departments: Department[], userId?: string): Department[] => {
	if (!userId) return [];
	return departments.filter(d => d.admins?.includes(userId));
};

export const filterDepartments = (departments: Department[], searchTerm: string): Department[] => {
	const normTerm = searchTerm.toLowerCase();
	return departments.filter(d => (d.name || '').toLowerCase().includes(normTerm));
};

export const filterUsers = (
	users: UserWithOptionalObjectId[],
	selectedDeptId: string,
): UserWithOptionalObjectId[] => {
	if (selectedDeptId === consts.allDeptsId) return users;
	return users.filter(user => {
		return user.departments?.some(deptId => {
			return getEntityId(deptId) === selectedDeptId;
		});
	});
};

export const getStatusTone = (status: UserStatus) => getUserStatusTone(status);
