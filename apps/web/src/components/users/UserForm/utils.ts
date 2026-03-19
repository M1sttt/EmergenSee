import { User, Department, UserRole, CreateUserDto, UpdateUserDto } from '@emergensee/shared';

export const getManagedDepartments = (
	allDepartments: Department[],
	currentUser: User | null,
): Department[] => {
	if (!currentUser) return [];
	const isGlobalAdmin = currentUser.role === UserRole.ADMIN;
	return isGlobalAdmin ? allDepartments : allDepartments.filter(d => d.admins?.includes(currentUser.id));
};

export const prepareUserData = (
	data: Partial<CreateUserDto> & Partial<UpdateUserDto>,
	user: User | null | undefined,
	managedDepartments: Department[],
	isGlobalAdmin: boolean,
): CreateUserDto | UpdateUserDto => {
	let finalDepartments = data.departments || [];

	if (!isGlobalAdmin && user?.departments) {
		const managedDeptIds = new Set(managedDepartments.map((d: any) => d.id || d._id));
		const unmanagedUserDepts = user.departments.filter(deptId => !managedDeptIds.has(deptId));
		finalDepartments = Array.from(new Set([...finalDepartments, ...unmanagedUserDepts]));
	}

	const preparedData = {
		...data,
		departments: finalDepartments,
	};

	if (!isGlobalAdmin && !user) {
		preparedData.role = UserRole.MEMBER;
	}

	return preparedData as CreateUserDto | UpdateUserDto;
};
