import { useMutation, useQuery } from '@tanstack/react-query';
import { CreateStatusUpdateDto, Event, ResponderStatus } from '@emergensee/shared';
import { eventsService } from 'services/eventsService';
import { statusService } from 'services/statusService';

export const EMERGENCY_REPORT_QUERY_KEYS = {
    events: ['events'] as const,
};

export function useEmergencyReportEventsQuery() {
    return useQuery<Event[]>({
        queryKey: EMERGENCY_REPORT_QUERY_KEYS.events,
        queryFn: eventsService.getAll,
    });
}

export function useEmergencyReportCreateStatusMutation(
    onSuccess?: (status: ResponderStatus) => void,
) {
    return useMutation({
        mutationFn: ({ status, eventId }: { status: ResponderStatus; eventId: string }) => {
            const payload: CreateStatusUpdateDto = { status, eventId };
            return statusService.create(payload);
        },
        onSuccess: (_, variables) => {
            onSuccess?.(variables.status);
        },
    });
}
