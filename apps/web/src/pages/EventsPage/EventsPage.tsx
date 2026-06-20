import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
	Event,
	EventStatus,
	EventType,
	EventPriority,
	EVENT_PRIORITY_LABELS,
	EVENT_STATUS_LABELS,
	EVENT_TYPE_LABELS,
} from '@emergensee/shared';
import { useWebSocket } from 'hooks/useWebSocket';
import { WebSocketEventType } from '@emergensee/shared';
import { FiEdit, FiCheckCircle, FiRefreshCw, FiChevronUp, FiChevronDown, FiX } from 'react-icons/fi';
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
import { SortField, SortDir } from './utils';

export default function EventsPage() {
	const queryClient = useQueryClient();
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [eventToClose, setEventToClose] = useState<string | null>(null);
	const [eventToReopen, setEventToReopen] = useState<string | null>(null);

	// filters
	const [search, setSearch] = useState('');
	const [filterType, setFilterType] = useState('');
	const [filterPriority, setFilterPriority] = useState('');
	const [filterStatus, setFilterStatus] = useState('');

	// sort
	const [sortField, setSortField] = useState<SortField | null>(null);
	const [sortDir, setSortDir] = useState<SortDir>('asc');

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

	const hasActiveFilters = !!(search || filterType || filterPriority || filterStatus);

	const clearFilters = useCallback(() => {
		setSearch('');
		setFilterType('');
		setFilterPriority('');
		setFilterStatus('');
	}, []);

	const toggleSort = useCallback((field: SortField) => {
		setSortField(prev => {
			if (prev === field) {
				setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
				return field;
			}
			setSortDir('asc');
			return field;
		});
	}, []);

	const displayedEvents = useMemo(() => {
		const filtered = utils.filterEvents(events, search, filterType, filterPriority, filterStatus);
		return utils.sortEvents(filtered, sortField, sortDir);
	}, [events, search, filterType, filterPriority, filterStatus, sortField, sortDir]);

	const SortIcon = ({ field }: { field: SortField }) => {
		if (sortField !== field) return <FiChevronUp className="ml-1 opacity-30" size={12} />;
		return sortDir === 'asc'
			? <FiChevronUp className="ml-1 text-blue-600" size={12} />
			: <FiChevronDown className="ml-1 text-blue-600" size={12} />;
	};

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

	const handleReopenEvent = (id: string) => {
		setEventToReopen(id);
	};

	const confirmReopenEvent = useCallback(() => {
		if (eventToReopen) {
			updateMutation.mutate({ id: eventToReopen, data: { status: EventStatus.ONGOING } });
			setEventToReopen(null);
		}
	}, [updateMutation, eventToReopen]);

	const cancelReopenEvent = useCallback(() => {
		setEventToReopen(null);
	}, []);

	const handleFormClose = () => {
		setIsFormOpen(false);
		setSelectedEvent(null);
	};

	const eventColumns: GenericTableColumn<Event>[] = [
		{
			id: 'title',
			header: (
				<button onClick={() => toggleSort('title')} className="flex items-center font-medium hover:text-blue-600 transition-colors">
					{strings.columnTitle}<SortIcon field="title" />
				</button>
			),
			renderCell: event => (
				<div className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={event.title}>
					{event.title}
				</div>
			),
		},
		{
			id: 'type',
			header: (
				<button onClick={() => toggleSort('type')} className="flex items-center font-medium hover:text-blue-600 transition-colors">
					{strings.columnType}<SortIcon field="type" />
				</button>
			),
			renderCell: event => <div className="text-sm text-gray-900">{EVENT_TYPE_LABELS[event.type]}</div>,
		},
		{
			id: 'priority',
			header: (
				<button onClick={() => toggleSort('priority')} className="flex items-center font-medium hover:text-blue-600 transition-colors">
					{strings.columnPriority}<SortIcon field="priority" />
				</button>
			),
			renderCell: event => (
				<Badge tone={utils.getPriorityTone(event.priority)}>{EVENT_PRIORITY_LABELS[event.priority]}</Badge>
			),
		},
		{
			id: 'status',
			header: (
				<button onClick={() => toggleSort('status')} className="flex items-center font-medium hover:text-blue-600 transition-colors">
					{strings.columnStatus}<SortIcon field="status" />
				</button>
			),
			renderCell: event => (
				<Badge tone={utils.getStatusTone(event.status)}>{EVENT_STATUS_LABELS[event.status]}</Badge>
			),
		},
		{
			id: 'updatedAt',
			header: strings.columnUpdatedAt,
			renderCell: event => (
				<div className="text-sm text-gray-500 whitespace-nowrap">
					{new Date(event.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
				</div>
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
						{isResolved ? (
							<IconButton
								onClick={() => handleReopenEvent(eventId)}
								className="text-orange-500"
								tooltipText={strings.tooltipReopenEvent}
							>
								<FiRefreshCw size={16} />
							</IconButton>
						) : (
							<IconButton
								onClick={() => handleCloseEvent(eventId)}
								className="text-green-600"
								tooltipText={strings.tooltipCloseEvent}
							>
								<FiCheckCircle size={16} />
							</IconButton>
						)}
					</div>
				);
			},
		},
	];

	return (
		<div className="ui-page">
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="ui-page-title">{strings.title}</h1>
				<Button onClick={() => setIsFormOpen(true)} variant="primary" size="md" className="w-full rounded-lg sm:w-auto">
					{strings.createBtn}
				</Button>
			</div>

			{/* Filter bar */}
			<div className="mb-6 flex flex-wrap items-center gap-2">
				<input
					type="text"
					placeholder={strings.searchPlaceholder}
					value={search}
					onChange={e => setSearch(e.target.value)}
					className="h-9 min-w-[160px] flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				{([
					{ value: filterType, onChange: setFilterType, placeholder: strings.filterTypePlaceholder, options: Object.values(EventType).map(t => ({ value: t, label: EVENT_TYPE_LABELS[t] })) },
					{ value: filterPriority, onChange: setFilterPriority, placeholder: strings.filterPriorityPlaceholder, options: Object.values(EventPriority).map(p => ({ value: p, label: EVENT_PRIORITY_LABELS[p] })) },
					{ value: filterStatus, onChange: setFilterStatus, placeholder: strings.filterStatusPlaceholder, options: Object.values(EventStatus).map(s => ({ value: s, label: EVENT_STATUS_LABELS[s] })) },
				] as const).map(({ value, onChange, placeholder, options }) => (
					<div key={placeholder} className="relative flex items-center">
						<select
							value={value}
							onChange={e => onChange(e.target.value)}
							className="h-9 appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">{placeholder}</option>
							{options.map(o => (
								<option key={o.value} value={o.value}>{o.label}</option>
							))}
						</select>
						<FiChevronDown size={14} className="pointer-events-none absolute right-2.5 text-gray-400" />
					</div>
				))}
				{hasActiveFilters && (
					<button
						onClick={clearFilters}
						className="flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-500 transition-colors hover:border-red-300 hover:text-red-500"
					>
						<FiX size={13} /> {strings.clearFilters}
					</button>
				)}
			</div>

			{/* Mobile card list */}
			{isLoading ? (
				<div className="ui-loading-state md:hidden"><Loader /></div>
			) : displayedEvents.length === 0 ? (
				<p className="ui-empty-state md:hidden">{strings.noEventsFound}</p>
			) : (
				<div className="flex flex-col gap-2 md:hidden">
					{displayedEvents.map(event => {
						const eventId = getEntityId(event);
						const isResolved = event.status === EventStatus.RESOLVED;
						return (
							<div
								key={eventId}
								className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
							>
								{/* Header: name + status badge */}
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<p className="text-sm font-bold text-gray-900 leading-snug">{event.title}</p>
										<p className="mt-0.5 text-xs text-gray-400">
											{new Date(event.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
										</p>
									</div>
									<Badge tone={utils.getStatusTone(event.status)} className="shrink-0 mt-0.5">
										{EVENT_STATUS_LABELS[event.status]}
									</Badge>
								</div>

								{/* Type + Priority grid */}
								<div className="mt-2 grid grid-cols-2 gap-2 border-t border-gray-100 pt-2">
									<div>
										<p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Type</p>
										<div className="flex items-center gap-1.5 text-xs font-medium text-gray-800">
											{EVENT_TYPE_LABELS[event.type]}
										</div>
									</div>
									<div>
										<p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Priority</p>
										<Badge tone={utils.getPriorityTone(event.priority)}>
											{EVENT_PRIORITY_LABELS[event.priority]}
										</Badge>
									</div>
								</div>

								{/* Actions */}
								<div className="mt-2 flex gap-2 border-t border-gray-100 pt-2">
									{isResolved ? (
										<button
											onClick={() => handleReopenEvent(eventId)}
											className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-xs font-semibold uppercase tracking-wide text-orange-500 transition-colors hover:bg-orange-50"
										>
											<FiRefreshCw size={12} /> {strings.tooltipReopenEvent}
										</button>
									) : (
										<>
											<button
												onClick={() => handleEdit(event)}
												className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600 transition-colors hover:bg-blue-50"
											>
												<FiEdit size={12} /> {strings.tooltipEdit}
											</button>
											<button
												onClick={() => handleCloseEvent(eventId)}
												className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-xs font-semibold uppercase tracking-wide text-green-600 transition-colors hover:bg-green-50"
											>
												<FiCheckCircle size={12} /> {strings.tooltipCloseEvent}
											</button>
										</>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Desktop table */}
			<div className="hidden md:block">
				<GenericTable
					columns={eventColumns}
					rows={displayedEvents}
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

			{eventToReopen && (
				<ConfirmModal
					title={strings.confirmReopenTitle}
					message={strings.confirmReopen}
					confirmText={strings.confirmReopenBtn}
					cancelText={strings.confirmReopenCancel}
					confirmVariant="primary"
					onConfirm={confirmReopenEvent}
					onCancel={cancelReopenEvent}
				/>
			)}
		</div>
	);
}
