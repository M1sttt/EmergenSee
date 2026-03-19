export const getEntityId = (entity: unknown): string => {
	if (!entity) return '';
	if (typeof entity === 'string') return entity;
	const typedEntity = entity as { id?: string; _id?: string };
	return typedEntity.id || typedEntity._id || '';
};

export interface GenericEntity {
	id?: string;
	_id?: string;
	[key: string]: unknown;
}

export const getDisplayUsers = (
	users: any[],
	statusUpdates: any[],
	selectedEventId: string,
	selectedDeptId: string,
	isGlobalAdmin: boolean,
	isDeptAdmin: boolean,
	userAdminDepts: any[],
) => {
	if (!selectedEventId || selectedEventId === '') return [];

	let filteredUsers = users;
	if (selectedDeptId !== 'all') {
		filteredUsers = users.filter(u => u.departments?.includes(selectedDeptId));
	} else {
		if (!isGlobalAdmin && isDeptAdmin) {
			const adminDeptIds = userAdminDepts.map(getEntityId);
			filteredUsers = users.filter(u => u.departments?.some((dId: string) => adminDeptIds.includes(dId)));
		}
	}

	return filteredUsers.map(u => {
		const userStatuses = statusUpdates.filter(s => {
			const uid = getEntityId(s.userId);
			const eid = getEntityId(s.eventId);
			return uid === getEntityId(u) && eid === selectedEventId;
		});
		userStatuses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		return {
			user: u,
			status: userStatuses.length > 0 ? userStatuses[0] : null,
		};
	});
};

export const canReportForUser = (
	user: any,
	isGlobalAdmin: boolean,
	isDeptAdmin: boolean,
	userAdminDepts: any[],
): boolean => {
	if (isGlobalAdmin) return true;
	if (isDeptAdmin && user.departments) {
		const adminDeptIds = userAdminDepts.map(getEntityId);
		return user.departments.some((ud: string) => adminDeptIds.includes(ud));
	}
	return false;
};
