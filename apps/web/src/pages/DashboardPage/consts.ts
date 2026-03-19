import { EventPriority } from '@emergensee/shared';

export const recentItemsLimit = 5;

export const eventsQueryKey = ['events'] as const;
export const statusQueryKey = ['status'] as const;

export const criticalPriorityStyle = 'bg-red-100 text-red-800';
export const highPriorityStyle = 'bg-orange-100 text-orange-800';
export const mediumPriorityStyle = 'bg-yellow-100 text-yellow-800';
export const lowPriorityStyle = 'bg-green-100 text-green-800';
export const defaultPriorityStyle = 'bg-gray-100 text-gray-800';

export const getPriorityStyle = (priority: EventPriority): string => {
    switch (priority) {
        case EventPriority.CRITICAL:
            return criticalPriorityStyle;
        case EventPriority.HIGH:
            return highPriorityStyle;
        case EventPriority.MEDIUM:
            return mediumPriorityStyle;
        case EventPriority.LOW:
            return lowPriorityStyle;
        default:
            return defaultPriorityStyle;
    }
};

export const commonStatusStyle = 'px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800';
