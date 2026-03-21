import { UserRole, CreateUserDto, UpdateUserDto } from '@emergensee/shared';
import { DepartmentWithOptionalObjectId, UserWithOptionalObjectId, getEntityId } from '@/types/entities';

export interface UserFormData {
	email: string;
	firstName: string;
	lastName: string;
	role?: UserRole;
	phoneNumber?: string;
	departments?: string[];
	password?: string;
}

export const getManagedDepartments = (
	allDepartments: DepartmentWithOptionalObjectId[],
	currentUser: UserWithOptionalObjectId | null,
): DepartmentWithOptionalObjectId[] => {
	if (!currentUser) return [];
	const isGlobalAdmin = currentUser.role === UserRole.ADMIN;
	const currentUserId = getEntityId(currentUser);
	return isGlobalAdmin ? allDepartments : allDepartments.filter(d => d.admins?.includes(currentUserId));
};

const mergeDepartmentsForDepartmentAdmin = (
	selectedDepartments: string[],
	existingDepartments: string[] | undefined,
	managedDepartments: DepartmentWithOptionalObjectId[],
) => {
	const managedDepartmentIds = new Set(managedDepartments.map(getEntityId));
	const unmanagedExistingDepartments = (existingDepartments || []).filter(
		departmentId => !managedDepartmentIds.has(departmentId),
	);

	return Array.from(new Set([...selectedDepartments, ...unmanagedExistingDepartments]));
};

export const prepareCreateUserData = (
	data: UserFormData,
	managedDepartments: DepartmentWithOptionalObjectId[],
	isGlobalAdmin: boolean,
): CreateUserDto => {
	const selectedDepartments = data.departments || [];
	const departments = isGlobalAdmin
		? selectedDepartments
		: mergeDepartmentsForDepartmentAdmin(selectedDepartments, [], managedDepartments);

	return {
		email: data.email,
		password: data.password || '',
		firstName: data.firstName,
		lastName: data.lastName,
		role: isGlobalAdmin ? data.role || UserRole.MEMBER : UserRole.MEMBER,
		phoneNumber: data.phoneNumber,
		departments,
	};
};

export const prepareUpdateUserData = (
	data: UserFormData,
	user: UserWithOptionalObjectId,
	managedDepartments: DepartmentWithOptionalObjectId[],
	isGlobalAdmin: boolean,
): UpdateUserDto => {
	const selectedDepartments = data.departments || [];
	const departments = isGlobalAdmin
		? selectedDepartments
		: mergeDepartmentsForDepartmentAdmin(selectedDepartments, user.departments, managedDepartments);

	const payload: UpdateUserDto = {
		email: data.email,
		firstName: data.firstName,
		lastName: data.lastName,
		phoneNumber: data.phoneNumber,
		departments,
	};

	if (isGlobalAdmin && data.role) {
		payload.role = data.role;
	}

	return payload;
};
