import { ResponderStatus, EventStatus, UserRole } from '@emergensee/shared';
import { IconType } from 'react-icons';
import {
	EventWithOptionalObjectId,
	StatusUpdateWithReferences,
	UserWithOptionalObjectId,
	getEntityId,
} from '@/types/entities';
import * as consts from './consts';
import * as strings from './strings';

export const getRelevantOngoingEvent = (
	events: EventWithOptionalObjectId[],
	user?: UserWithOptionalObjectId | null,
) => {
	return events.find(
		event =>
			event.status === EventStatus.ONGOING &&
			event.departments?.some(dept => {
				const deptId = getEntityId(dept);
				return user?.departments?.some(userDept => {
					const userDeptId = getEntityId(userDept);
					return deptId === userDeptId;
				});
			}),
	);
};

export const hasUserReportedForEvent = (eventId: string, myStatuses: StatusUpdateWithReferences[]) => {
	return myStatuses.some(status => {
		const sEventId = getEntityId(status.eventId);
		return sEventId === eventId && status.status !== ResponderStatus.UNKNOWN;
	});
};

export interface NavigationLink {
	name: string;
	href: string;
	Icon: IconType;
	isEmergency?: boolean;
	needsPulse?: boolean;
}

export const getNavigationLinks = (
	hasRelevantOngoingEvent: boolean,
	hasReportedForEvent: boolean,
	userRole?: UserRole,
): NavigationLink[] => {
	const isAdmin = userRole === UserRole.ADMIN;

	const baseNavigation: NavigationLink[] = isAdmin
		? [
				{ name: strings.dashboard, href: consts.dashboardRoute, Icon: consts.dashboardIcon },
				{ name: strings.events, href: consts.eventsRoute, Icon: consts.eventsIcon },
				{ name: strings.shelters, href: consts.sheltersRoute, Icon: consts.sheltersIcon },
				{ name: strings.users, href: consts.usersRoute, Icon: consts.usersIcon },
				{ name: strings.departments, href: consts.departmentsRoute, Icon: consts.departmentsIcon },
				{ name: strings.status, href: consts.statusRoute, Icon: consts.statusIcon },
				{ name: strings.camera, href: consts.cameraRoute, Icon: consts.cameraIcon },
				{ name: strings.cameraStations, href: consts.adminCamerasRoute, Icon: consts.adminCamerasIcon },
			]
		: [
				{ name: strings.camera, href: consts.cameraRoute, Icon: consts.cameraIcon },
				{ name: strings.shelters, href: consts.sheltersRoute, Icon: consts.sheltersIcon },
			];

	if (hasRelevantOngoingEvent) {
		return [
			...baseNavigation,
			{
				name: strings.emergencyReport,
				href: consts.emergencyReportRoute,
				Icon: consts.emergencyIcon,
				isEmergency: true,
				needsPulse: !hasReportedForEvent,
			},
		];
	}
	return baseNavigation;
};
