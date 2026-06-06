import axios from 'axios';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CreateStatusUpdateDto, Event, ResponderStatus } from '@emergensee/shared';
import { eventsService } from 'services/eventsService';
import { statusService } from 'services/statusService';
import { offlineQueue, OfflineQueuedError } from 'services/offlineQueue';
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
		mutationFn: async ({ status, eventId }: { status: ResponderStatus; eventId: string }) => {
			const payload: CreateStatusUpdateDto = { status, eventId };
			if (!navigator.onLine) {
				offlineQueue.enqueue(payload);
				throw new OfflineQueuedError();
			}
			try {
				return await statusService.create(payload);
			} catch (error) {
				if (axios.isAxiosError(error) && !error.response) {
					offlineQueue.enqueue(payload);
					throw new OfflineQueuedError();
				}
				throw error;
			}
		},
		onSuccess: (_, variables) => {
			onSuccess?.(variables.status);
			if (variables.status === ResponderStatus.SAFE) {
				toast.success(strings.emergencySafeReportSuccess);
			} else {
				toast.success(strings.emergencyHelpReportSuccess);
			}
		},
		onError: (error: unknown) => {
			if (error instanceof OfflineQueuedError) {
				toast.warning(strings.emergencyReportQueued);
				return;
			}
			toast.error(strings.emergencyReportError);
		},
	});
}
