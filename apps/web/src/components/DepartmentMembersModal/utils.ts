import { User } from '@emergensee/shared';
import * as consts from './consts';

export const filterUsers = (
	users: User[],
	departmentId: string,
	activeTab: typeof consts.addTab | typeof consts.removeTab,
	searchQuery: string,
): User[] => {
	let list: User[] = [];

	if (activeTab === consts.addTab) {
		list = users.filter(u => !(u.departments || []).includes(departmentId));
	} else {
		list = users.filter(u => (u.departments || []).includes(departmentId));
	}

	if (!searchQuery.trim()) return list;

	const q = searchQuery.toLowerCase();
	return list.filter(
		u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
	);
};

export const toggleSelection = (currentSelection: Set<string>, userId: string): Set<string> => {
	const newSet = new Set(currentSelection);
	if (newSet.has(userId)) {
		newSet.delete(userId);
	} else {
		newSet.add(userId);
	}
	return newSet;
};

export const getUpdatedDepartments = (
	userDepartments: string[] = [],
	departmentId: string,
	activeTab: typeof consts.addTab | typeof consts.removeTab,
): string[] => {
	let updated = [...userDepartments];
	if (activeTab === consts.addTab) {
		if (!updated.includes(departmentId)) {
			updated.push(departmentId);
		}
	} else {
		updated = updated.filter(id => id !== departmentId);
	}
	return updated;
};
