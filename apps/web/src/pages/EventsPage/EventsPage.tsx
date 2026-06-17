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
import GenericTable, { type GenericTableColumn } from '@/components/common/GenericTable';
import EventForm from '@/components/EventForm';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Loader } from '@/components/common/Loader';
import { getEntityId } from '@/types/entities';
import { Badge, Button, IconButton } from '@/components/ui';
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

	const eventColumns: GenericTableColumn<Event>[] = [
		{
			id: 'title',
			header: strings.columnTitle,
			renderCell: event => (
				<div className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={event.title}>
					{event.title}
				</div>
			),
		},
		{
			id: 'type',
			header: strings.columnType,
			renderCell: event => <div className="text-sm text-gray-900">{EVENT_TYPE_LABELS[event.type]}</div>,
		},
		{
			id: 'priority',
			header: strings.columnPriority,
			renderCell: event => (
				<Badge tone={utils.getPriorityTone(event.priority)}>{EVENT_PRIORITY_LABELS[event.priority]}</Badge>
			),
		},
		{
			id: 'status',
			header: strings.columnStatus,
			renderCell: event => (
				<Badge tone={utils.getStatusTone(event.status)}>{EVENT_STATUS_LABELS[event.status]}</Badge>
			),
		},
		{
			id: 'actions',
			header: strings.columnActions,
			headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
			cellClassName: 'px-6 py-4 whitespace-nowrap text-left text-sm font-medium',
			renderCell: event => {
				const eventId = getEntityId(event);
				const isResolved = event.status === EventStatus.RESOLVED;
				return (
					<div className="flex justify-start gap-2">
						<IconButton
							onClick={() => handleEdit(event)}
							disabled={isResolved}
							className="text-blue-600"
							tooltipText={strings.tooltipEdit}
						>
							<FiEdit size={16} />
						</IconButton>
						<IconButton
							onClick={() => handleCloseEvent(eventId)}
							disabled={isResolved}
							className="text-green-600"
							tooltipText={strings.tooltipCloseEvent}
						>
							<FiCheckCircle size={16} />
						</IconButton>
					</div>
				);
			},
		},
	];

	return (
		<div className="ui-page">
			<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="ui-page-title">{strings.title}</h1>
				<Button onClick={() => setIsFormOpen(true)} variant="primary" size="md" className="w-full rounded-lg sm:w-auto">
					{strings.createBtn}
				</Button>
			</div>

			{/* Mobile card list */}
			{isLoading ? (
				<div className="ui-loading-state md:hidden"><Loader /></div>
			) : events.length === 0 ? (
				<p className="ui-empty-state md:hidden">{strings.noEventsFound}</p>
			) : (
				<div className="flex flex-col gap-3 md:hidden">
					{events.map(event => {
						const eventId = getEntityId(event);
						const isResolved = event.status === EventStatus.RESOLVED;
						return (
							<div
								key={eventId}
								className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
							>
								<div className="flex items-start justify-between gap-2">
									<p className="flex-1 text-sm font-semibold text-gray-900 leading-snug">{event.title}</p>
									<Badge tone={utils.getStatusTone(event.status)}>{EVENT_STATUS_LABELS[event.status]}</Badge>
								</div>
								<div className="mt-2 flex flex-wrap items-center gap-2">
									<span className="text-xs text-gray-500">{EVENT_TYPE_LABELS[event.type]}</span>
									<span className="text-gray-300">·</span>
									<Badge tone={utils.getPriorityTone(event.priority)}>{EVENT_PRIORITY_LABELS[event.priority]}</Badge>
								</div>
								{!isResolved && (
									<div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
										<button
											onClick={() => handleEdit(event)}
											className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
										>
											<FiEdit size={13} /> {strings.tooltipEdit}
										</button>
										<button
											onClick={() => handleCloseEvent(eventId)}
											className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-green-600 transition-colors hover:bg-green-50"
										>
											<FiCheckCircle size={13} /> {strings.tooltipCloseEvent}
										</button>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Desktop table */}
			<div className="hidden md:block">
				<GenericTable
					columns={eventColumns}
					rows={events}
					getRowKey={event => getEntityId(event)}
					isLoading={isLoading}
					loadingContent={<div className="ui-loading-state"><Loader /></div>}
					emptyContent={strings.noEventsFound}
				/>
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
