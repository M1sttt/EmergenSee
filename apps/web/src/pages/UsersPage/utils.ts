import { User, UserRole, UserStatus, Department } from '@emergensee/shared';
import { getUserStatusTone } from '@/consts/ui';
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

export const filterUsers = (users: User[], selectedDeptId: string): User[] => {
	if (selectedDeptId === consts.allDeptsId) return users;
	return users.filter(user => {
		return user.departments?.some(deptId => {
			const idStr = typeof deptId === 'string' ? deptId : (deptId as any)._id || (deptId as any).id;
			return idStr === selectedDeptId;
		});
	});
};

export const getStatusTone = (status: UserStatus) => getUserStatusTone(status);
