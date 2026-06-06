import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { offlineQueue } from 'services/offlineQueue';
import { statusService } from 'services/statusService';
import { LAYOUT_QUERY_KEYS } from 'hooks/data/useLayoutData';
import * as strings from 'hooks/data/strings';

export function useOfflineStatusQueue() {
	const queryClient = useQueryClient();

	const flush = useCallback(async () => {
		const pending = offlineQueue.dequeueAll();
		if (pending.length === 0) return;

		const results = await Promise.allSettled(pending.map(item => statusService.create(item.payload)));

		const failedIndices: number[] = [];
		results.forEach((result, i) => {
			if (result.status === 'rejected') failedIndices.push(i);
		});

		failedIndices.forEach(i => offlineQueue.enqueue(pending[i].payload));

		const succeededCount = pending.length - failedIndices.length;
		if (succeededCount > 0) {
			queryClient.invalidateQueries({ queryKey: LAYOUT_QUERY_KEYS.status });
			toast.success(strings.offlineQueueFlushed);
		}
		if (failedIndices.length > 0) {
			toast.error(strings.offlineQueueFlushError);
		}
	}, [queryClient]);

	useEffect(() => {
		if (navigator.onLine && offlineQueue.size() > 0) {
			flush();
		}
		window.addEventListener('online', flush);
		return () => window.removeEventListener('online', flush);
	}, [flush]);
}
