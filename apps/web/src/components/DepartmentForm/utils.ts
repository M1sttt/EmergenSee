import { Department } from '@emergensee/shared';

export const getAvailableSubDepartments = (
	allDepartments: Department[],
	currentDepartment: Department | null,
): Department[] => {
	return allDepartments.filter(d => !currentDepartment || d.id !== currentDepartment.id);
};
