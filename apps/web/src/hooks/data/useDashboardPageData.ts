import { useQuery } from '@tanstack/react-query';
import { Event, StatusUpdate } from '@emergensee/shared';
import { eventsService } from 'services/eventsService';
import { statusService } from 'services/statusService';

export const DASHBOARD_PAGE_QUERY_KEYS = {
    events: ['events'] as const,
    status: ['status'] as const,
};

export function useDashboardPageEventsQuery() {
    return useQuery<Event[]>({
        queryKey: DASHBOARD_PAGE_QUERY_KEYS.events,
        queryFn: eventsService.getAll,
    });
}

export function useDashboardPageStatusQuery() {
    return useQuery<StatusUpdate[]>({
        queryKey: DASHBOARD_PAGE_QUERY_KEYS.status,
        queryFn: statusService.getAll,
    });
}
