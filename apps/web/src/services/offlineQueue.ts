import { CreateStatusUpdateDto } from '@emergensee/shared';

const QUEUE_KEY = 'emergensee_offline_status_queue';

export interface QueuedStatusReport {
	payload: CreateStatusUpdateDto;
	queuedAt: number;
}

export class OfflineQueuedError extends Error {
	constructor() {
		super('Report queued for offline submission');
		this.name = 'OfflineQueuedError';
	}
}

function readQueue(): QueuedStatusReport[] {
	try {
		const raw = localStorage.getItem(QUEUE_KEY);
		return raw ? (JSON.parse(raw) as QueuedStatusReport[]) : [];
	} catch {
		return [];
	}
}

function writeQueue(queue: QueuedStatusReport[]): void {
	localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export const offlineQueue = {
	enqueue(payload: CreateStatusUpdateDto): void {
		const queue = readQueue();
		queue.push({ payload, queuedAt: Date.now() });
		writeQueue(queue);
	},

	dequeueAll(): QueuedStatusReport[] {
		const queue = readQueue();
		writeQueue([]);
		return queue;
	},

	size(): number {
		return readQueue().length;
	},
};
