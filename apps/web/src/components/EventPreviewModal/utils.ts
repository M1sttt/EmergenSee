import { Department, Event, ResponderStatus, StatusUpdate, User, UserRole } from '@emergensee/shared';
import { getEntityId, toDate } from '@/types/entities';

export interface EventAttendant {
	user: User;
	status: ResponderStatus;
	statusUpdate: StatusUpdate | null;
	departmentNames: string[];
}

export interface AttendanceSummary {
	safe: number;
	needHelp: number;
	away: number;
	unknown: number;
	total: number;
	reported: number;
}

export const getEventDepartmentIds = (event: Event): Set<string> =>
	new Set((event.departments || []).map(getEntityId).filter(Boolean));

export const getEventDepartments = (event: Event, departments: Department[]): Department[] => {
	const eventDepartmentIds = getEventDepartmentIds(event);
	return departments.filter(department => eventDepartmentIds.has(getEntityId(department)));
};

export const getEventAttendants = (
	event: Event,
	users: User[],
	statusUpdates: StatusUpdate[],
	departments: Department[],
): EventAttendant[] => {
	const eventDepartmentIds = getEventDepartmentIds(event);
	const eventId = getEntityId(event);

	const departmentNameById = new Map(
		departments.map(department => [getEntityId(department), department.name]),
	);

	const latestByUser = new Map<string, StatusUpdate>();
	for (const statusUpdate of statusUpdates) {
		if (getEntityId(statusUpdate.eventId) !== eventId) continue;
		const userId = getEntityId(statusUpdate.userId);
		if (!userId) continue;
		const existing = latestByUser.get(userId);
		if (!existing || toDate(statusUpdate.createdAt) > toDate(existing.createdAt)) {
			latestByUser.set(userId, statusUpdate);
		}
	}

	return users
		.filter(
			user =>
				user.role !== UserRole.CAMERA &&
				(user.departments || []).some(departmentId => eventDepartmentIds.has(getEntityId(departmentId))),
		)
		.map(user => {
			const statusUpdate = latestByUser.get(getEntityId(user)) || null;
			return {
				user,
				statusUpdate,
				status: statusUpdate?.status ?? ResponderStatus.UNKNOWN,
				departmentNames: (user.departments || [])
					.filter(departmentId => eventDepartmentIds.has(getEntityId(departmentId)))
					.map(departmentId => departmentNameById.get(getEntityId(departmentId)) || '')
					.filter(Boolean),
			};
		})
		.sort((a, b) => statusWeight(a.status) - statusWeight(b.status));
};

const statusWeight = (status: ResponderStatus): number => {
	switch (status) {
		case ResponderStatus.NEED_HELP:
			return 0;
		case ResponderStatus.UNKNOWN:
			return 1;
		case ResponderStatus.AWAY:
			return 2;
		default:
			return 3;
	}
};

export const summarizeAttendants = (attendants: EventAttendant[]): AttendanceSummary => {
	const summary: AttendanceSummary = {
		safe: 0,
		needHelp: 0,
		away: 0,
		unknown: 0,
		total: attendants.length,
		reported: 0,
	};

	for (const attendant of attendants) {
		switch (attendant.status) {
			case ResponderStatus.SAFE:
				summary.safe++;
				break;
			case ResponderStatus.NEED_HELP:
				summary.needHelp++;
				break;
			case ResponderStatus.AWAY:
				summary.away++;
				break;
			default:
				summary.unknown++;
		}
		if (attendant.statusUpdate) summary.reported++;
	}

	return summary;
};

export const getInitials = (user: User): string =>
	`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '?';

export const formatCoordinates = (event: Event): string => {
	const coordinates = event.location?.coordinates;
	if (!coordinates || coordinates.length < 2) return '';
	const [longitude, latitude] = coordinates;
	return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};
