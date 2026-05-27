import {
	DepartmentWithOptionalObjectId,
	StatusUpdateWithReferences,
	UserWithOptionalObjectId,
	getEntityId,
	toDate,
} from '@/types/entities';

export const getDisplayUsers = (
	users: UserWithOptionalObjectId[],
	statusUpdates: StatusUpdateWithReferences[],
	selectedEventId: string,
	selectedDeptId: string,
	isGlobalAdmin: boolean,
	isDeptAdmin: boolean,
	userAdminDepts: DepartmentWithOptionalObjectId[],
) => {
	if (!selectedEventId || selectedEventId === '') return [];

	let filteredUsers = users;
	if (selectedDeptId !== 'all') {
		filteredUsers = users.filter(u => u.departments?.includes(selectedDeptId));
	} else {
		if (!isGlobalAdmin && isDeptAdmin) {
			const adminDeptIds = userAdminDepts.map(getEntityId);
			filteredUsers = users.filter(u => u.departments?.some(dId => adminDeptIds.includes(getEntityId(dId))));
		}
	}

	return filteredUsers.map(u => {
		const userStatuses = statusUpdates.filter(s => {
			const uid = getEntityId(s.userId);
			const eid = getEntityId(s.eventId);
			return uid === getEntityId(u) && eid === selectedEventId;
		});
		userStatuses.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());

		return {
			user: u,
			status: userStatuses.length > 0 ? userStatuses[0] : null,
		};
	});
};

export const canReportForUser = (
	user: UserWithOptionalObjectId,
	isGlobalAdmin: boolean,
	isDeptAdmin: boolean,
	userAdminDepts: DepartmentWithOptionalObjectId[],
): boolean => {
	if (isGlobalAdmin) return true;
	if (isDeptAdmin && user.departments) {
		const adminDeptIds = userAdminDepts.map(getEntityId);
		return user.departments.some(ud => adminDeptIds.includes(getEntityId(ud)));
	}
	return false;
};
