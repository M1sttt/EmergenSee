import { User, Event, ResponderStatus, EventStatus } from '@emergensee/shared';
import { CONSTS } from './consts';
import { STRINGS } from './strings';

export const getRelevantOngoingEvent = (events: Event[], user?: User | null) => {
	return events.find(
		event =>
			event.status === EventStatus.ONGOING &&
			event.departments?.some(dept => {
				const deptId = typeof dept === 'string' ? dept : (dept as any)._id || (dept as any).id;
				return user?.departments?.some(userDept => {
					const userDeptId =
						typeof userDept === 'string' ? userDept : (userDept as any)._id || (userDept as any).id;
					return deptId === userDeptId;
				});
			}),
	);
};

export const hasUserReportedForEvent = (eventId: string, myStatuses: any[]) => {
	return myStatuses.some(status => {
		const sEventId =
			typeof status.eventId === 'string'
				? status.eventId
				: (status.eventId as any)?._id || (status.eventId as any)?.id;
		return sEventId === eventId && status.status !== ResponderStatus.UNKNOWN;
	});
};

export const getNavigationLinks = (hasRelevantOngoingEvent: boolean, hasReportedForEvent: boolean) => {
	const baseNavigation = [
		{ name: STRINGS.DASHBOARD, href: CONSTS.ROUTES.DASHBOARD, Icon: CONSTS.ICONS.DASHBOARD },
		{ name: STRINGS.EVENTS, href: CONSTS.ROUTES.EVENTS, Icon: CONSTS.ICONS.EVENTS },
		{ name: STRINGS.MAP, href: CONSTS.ROUTES.MAP, Icon: CONSTS.ICONS.MAP },
		{ name: STRINGS.USERS, href: CONSTS.ROUTES.USERS, Icon: CONSTS.ICONS.USERS },
		{ name: STRINGS.DEPARTMENTS, href: CONSTS.ROUTES.DEPARTMENTS, Icon: CONSTS.ICONS.DEPARTMENTS },
		{ name: STRINGS.STATUS, href: CONSTS.ROUTES.STATUS, Icon: CONSTS.ICONS.STATUS },
	];

	if (hasRelevantOngoingEvent) {
		return [
			...baseNavigation,
			{
				name: STRINGS.EMERGENCY_REPORT,
				href: CONSTS.ROUTES.EMERGENCY_REPORT,
				Icon: CONSTS.ICONS.EMERGENCY,
				isEmergency: true,
				needsPulse: !hasReportedForEvent,
			},
		];
	}
	return baseNavigation;
};
