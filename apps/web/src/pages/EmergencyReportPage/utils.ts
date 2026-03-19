import { EventStatus, Event, User } from '@emergensee/shared';

export const findOngoingRelatedEvent = (events: Event[], user: User | null) => {
	return events.find(
		event =>
			event.status === EventStatus.ONGOING &&
			event.departments?.some((dept: any) => {
				const deptId = typeof dept === 'string' ? dept : dept._id || dept.id;
				return user?.departments?.some((userDept: any) => {
					const userDeptId = typeof userDept === 'string' ? userDept : userDept._id || userDept.id;
					return deptId === userDeptId;
				});
			}),
	);
};
