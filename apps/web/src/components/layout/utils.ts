import { User, Event, ResponderStatus, EventStatus } from '@emergensee/shared';
import * as consts from './consts';
import * as strings from './strings';

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
        { name: strings.dashboard, href: consts.dashboardRoute, Icon: consts.dashboardIcon },
        { name: strings.events, href: consts.eventsRoute, Icon: consts.eventsIcon },
        { name: strings.map, href: consts.mapRoute, Icon: consts.mapIcon },
        { name: strings.users, href: consts.usersRoute, Icon: consts.usersIcon },
        { name: strings.departments, href: consts.departmentsRoute, Icon: consts.departmentsIcon },
        { name: strings.status, href: consts.statusRoute, Icon: consts.statusIcon },
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
