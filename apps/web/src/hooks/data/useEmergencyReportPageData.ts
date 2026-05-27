import { useMutation, useQuery } from '@tanstack/react-query';
import { CreateStatusUpdateDto, Event, ResponderStatus } from '@emergensee/shared';
import { eventsService } from 'services/eventsService';
import { statusService } from 'services/statusService';
import { toast } from 'sonner';
import * as strings from './strings';

export const EMERGENCY_REPORT_QUERY_KEYS = {
	events: ['events'] as const,
};

export function useEmergencyReportEventsQuery() {
	return useQuery<Event[]>({
		queryKey: EMERGENCY_REPORT_QUERY_KEYS.events,
		queryFn: eventsService.getAll,
	});
}

export function useEmergencyReportCreateStatusMutation(onSuccess?: (status: ResponderStatus) => void) {
	return useMutation({
		mutationFn: ({ status, eventId }: { status: ResponderStatus; eventId: string }) => {
			const payload: CreateStatusUpdateDto = { status, eventId };
			return statusService.create(payload);
		},
		onSuccess: (_, variables) => {
			onSuccess?.(variables.status);
			if (variables.status === ResponderStatus.SAFE) {
				toast.success(strings.emergencySafeReportSuccess);
			} else {
				toast.success(strings.emergencyHelpReportSuccess);
			}
		},
		onError: () => {
			toast.error(strings.emergencyReportError);
		},
	});
}
