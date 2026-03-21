import { EventStatus } from '@emergensee/shared';
import { EventWithOptionalObjectId, UserWithOptionalObjectId, getEntityId } from '@/types/entities';

export const findOngoingRelatedEvent = (
	events: EventWithOptionalObjectId[],
	user: UserWithOptionalObjectId | null,
) => {
	return events.find(
		event =>
			event.status === EventStatus.ONGOING &&
			event.departments?.some(dept => {
				const deptId = getEntityId(dept);
				return user?.departments?.some(userDept => getEntityId(userDept) === deptId);
			}),
	);
};
