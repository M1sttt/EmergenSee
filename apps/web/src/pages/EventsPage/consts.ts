import { EventPriority, EventStatus } from '@emergensee/shared';

export const eventsQueryKey = 'events';

export const defaultPriorityColor = 'bg-gray-100 text-gray-800';
export const defaultStatusColor = 'bg-gray-100 text-gray-800';

export const criticalPriorityColor = 'bg-red-100 text-red-800';
export const highPriorityColor = 'bg-orange-100 text-orange-800';
export const mediumPriorityColor = 'bg-yellow-100 text-yellow-800';
export const lowPriorityColor = 'bg-green-100 text-green-800';

export const ongoingStatusColor = 'bg-blue-100 text-blue-800';
export const resolvedStatusColor = 'bg-green-100 text-green-800';
export const cancelledStatusColor = 'bg-red-100 text-red-800';

export const getPriorityColorClass = (priority: EventPriority): string => {
	switch (priority) {
		case EventPriority.CRITICAL:
			return criticalPriorityColor;
		case EventPriority.HIGH:
			return highPriorityColor;
		case EventPriority.MEDIUM:
			return mediumPriorityColor;
		case EventPriority.LOW:
			return lowPriorityColor;
		default:
			return defaultPriorityColor;
	}
};

export const getStatusColorClass = (status: EventStatus): string => {
	switch (status) {
		case EventStatus.ONGOING:
			return ongoingStatusColor;
		case EventStatus.RESOLVED:
			return resolvedStatusColor;
		case EventStatus.CANCELLED:
			return cancelledStatusColor;
		default:
			return defaultStatusColor;
	}
};
