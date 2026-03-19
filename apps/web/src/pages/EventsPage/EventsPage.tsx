import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
	Event,
	EventStatus,
	EVENT_PRIORITY_LABELS,
	EVENT_STATUS_LABELS,
	EVENT_TYPE_LABELS,
} from '@emergensee/shared';
import { useWebSocket } from 'hooks/useWebSocket';
import { WebSocketEventType } from '@emergensee/shared';
import { FiEdit, FiCheckCircle } from 'react-icons/fi';
import { ActionIcon } from '@/components/common/ActionIcon';
import EventForm from '@/components/EventForm';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Loader } from '@/components/common/Loader';
import {
	EVENTS_PAGE_QUERY_KEYS,
	useEventsPageQuery,
	useEventsPageUpdateMutation,
} from 'hooks/data/useEventsPageData';
import * as strings from './strings';
import * as utils from './utils';

export default function EventsPage() {
	const queryClient = useQueryClient();
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [eventToClose, setEventToClose] = useState<string | null>(null);

	const { data: events = [], isLoading } = useEventsPageQuery();

	const updateMutation = useEventsPageUpdateMutation();

	// WebSocket listeners
	useWebSocket(
		WebSocketEventType.EVENT_CREATED,
		useCallback(() => {
			queryClient.invalidateQueries({ queryKey: EVENTS_PAGE_QUERY_KEYS.events });
		}, [queryClient]),
	);

	useWebSocket(
		WebSocketEventType.EVENT_UPDATED,
		useCallback(() => {
			queryClient.invalidateQueries({ queryKey: EVENTS_PAGE_QUERY_KEYS.events });
		}, [queryClient]),
	);

	useWebSocket(
		WebSocketEventType.EVENT_DELETED,
		useCallback(() => {
			queryClient.invalidateQueries({ queryKey: EVENTS_PAGE_QUERY_KEYS.events });
		}, [queryClient]),
	);

	const handleEdit = (event: Event) => {
		setSelectedEvent(event);
		setIsFormOpen(true);
	};

	const handleCloseEvent = (id: string) => {
		setEventToClose(id);
	};

	const confirmCloseEvent = useCallback(() => {
		if (eventToClose) {
			updateMutation.mutate({ id: eventToClose, data: { status: EventStatus.RESOLVED } });
			setEventToClose(null);
		}
	}, [updateMutation, eventToClose]);

	const cancelCloseEvent = useCallback(() => {
		setEventToClose(null);
	}, []);

	const handleFormClose = () => {
		setIsFormOpen(false);
		setSelectedEvent(null);
	};

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold text-gray-900">{strings.title}</h1>
				<button
					onClick={() => setIsFormOpen(true)}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{strings.createBtn}
				</button>
			</div>

			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{strings.columnTitle}
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{strings.columnType}
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{strings.columnPriority}
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{strings.columnStatus}
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								{strings.columnActions}
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{isLoading ? (
							<tr>
								<td colSpan={5} className="py-8">
									<Loader />
								</td>
							</tr>
						) : events.length === 0 ? (
							<tr>
								<td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
									No events found.
								</td>
							</tr>
						) : (
							events.map(event => {
								const eventId = event.id || (event as any)._id;
								return (
									<tr key={eventId}>
										<td className="px-6 py-4 whitespace-nowrap">
											<div
												className="text-sm font-medium text-gray-900 truncate max-w-[150px]"
												title={event.title}
											>
												{event.title}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">{EVENT_TYPE_LABELS[event.type]}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${utils.getPriorityColor(event.priority)}`}
											>
												{EVENT_PRIORITY_LABELS[event.priority]}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${utils.getStatusColor(event.status)}`}
											>
												{EVENT_STATUS_LABELS[event.status]}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<div className="flex justify-end gap-2">
												<ActionIcon
													onClick={() => handleEdit(event)}
													className="text-blue-600"
													tooltipText={strings.tooltipEdit}
												>
													<FiEdit size={16} />
												</ActionIcon>
												<ActionIcon
													onClick={() => handleCloseEvent(eventId)}
													className="text-green-600"
													tooltipText={strings.tooltipCloseEvent}
												>
													<FiCheckCircle size={16} />
												</ActionIcon>
											</div>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			{isFormOpen && <EventForm event={selectedEvent} onClose={handleFormClose} />}

			{eventToClose && (
				<ConfirmModal
					message={strings.confirmClose}
					onConfirm={confirmCloseEvent}
					onCancel={cancelCloseEvent}
				/>
			)}
		</div>
	);
}
