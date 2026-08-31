import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
	EVENT_PRIORITY_LABELS,
	EVENT_STATUS_LABELS,
	EVENT_TYPE_LABELS,
	RESPONDER_STATUS_LABELS,
	ResponderStatus,
} from '@emergensee/shared';
import { FiClock, FiCheckCircle, FiMapPin, FiUser, FiUsers, FiX } from 'react-icons/fi';
import { getEventStatusTone, getResponderStatusTone } from '@/consts/ui';
import { getEntityId, getReferenceName, toDate } from '@/types/entities';
import { Badge, Button, IconButton } from '@/components/ui';
import { Loader } from '@/components/common/Loader';
import { cn } from '@/utils/cn';
import {
	useEventPreviewModalDepartmentsQuery,
	useEventPreviewModalEventsQuery,
	useEventPreviewModalStatusQuery,
	useEventPreviewModalUsersQuery,
} from 'hooks/data/useEventPreviewModalData';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';

export interface EventPreviewModalProps {
	eventId: string;
	highlightUserId?: string | null;
	onClose: () => void;
}

const statusFilters = [
	ResponderStatus.SAFE,
	ResponderStatus.NEED_HELP,
	ResponderStatus.AWAY,
	ResponderStatus.UNKNOWN,
];

interface DetailRowProps {
	icon: React.ReactNode;
	label: string;
	value: string;
}

const DetailRow = ({ icon, label, value }: DetailRowProps) => (
	<div className="flex items-start gap-2.5">
		<span className="mt-0.5 shrink-0 text-base">{icon}</span>
		<div className="min-w-0">
			<p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
			<p className="truncate text-sm text-gray-800">{value}</p>
		</div>
	</div>
);

interface FilterChipProps {
	label: string;
	count: number;
	isActive: boolean;
	onClick: () => void;
}

const FilterChip = ({ label, count, isActive, onClick }: FilterChipProps) => (
	<button
		type="button"
		onClick={onClick}
		className={cn(
			'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all active:scale-95',
			isActive
				? 'border-blue-500 bg-blue-50 text-blue-700'
				: 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700',
		)}
	>
		<span>{label}</span>
		<span
			className={cn(
				'rounded-full px-1.5 text-[10px]',
				isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500',
			)}
		>
			{count}
		</span>
	</button>
);

const EventPreviewModal: React.FC<EventPreviewModalProps> = ({ eventId, highlightUserId, onClose }) => {
	const [statusFilter, setStatusFilter] = useState<string>(consts.allAttendantsFilter);
	const highlightRef = useRef<HTMLLIElement | null>(null);

	const { data: events = [], isLoading: isLoadingEvents } = useEventPreviewModalEventsQuery();
	const { data: departments = [], isLoading: isLoadingDepartments } = useEventPreviewModalDepartmentsQuery();
	const { data: users = [], isLoading: isLoadingUsers } = useEventPreviewModalUsersQuery();
	const { data: statusUpdates = [], isLoading: isLoadingStatus } = useEventPreviewModalStatusQuery();

	const isLoading = isLoadingEvents || isLoadingDepartments || isLoadingUsers || isLoadingStatus;

	const event = useMemo(() => events.find(item => getEntityId(item) === eventId) || null, [events, eventId]);

	const eventDepartments = useMemo(
		() => (event ? utils.getEventDepartments(event, departments) : []),
		[event, departments],
	);

	const attendants = useMemo(
		() => (event ? utils.getEventAttendants(event, users, statusUpdates, departments) : []),
		[event, users, statusUpdates, departments],
	);

	const summary = useMemo(() => utils.summarizeAttendants(attendants), [attendants]);

	const visibleAttendants = useMemo(
		() =>
			statusFilter === consts.allAttendantsFilter
				? attendants
				: attendants.filter(attendant => attendant.status === statusFilter),
		[attendants, statusFilter],
	);

	const summaryByStatus = useMemo(
		() => ({
			[ResponderStatus.SAFE]: summary.safe,
			[ResponderStatus.NEED_HELP]: summary.needHelp,
			[ResponderStatus.AWAY]: summary.away,
			[ResponderStatus.UNKNOWN]: summary.unknown,
		}),
		[summary],
	);

	useEffect(() => {
		const handleEscape = (keyboardEvent: KeyboardEvent) => {
			if (keyboardEvent.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [onClose]);

	useEffect(() => {
		highlightRef.current?.scrollIntoView({ block: 'center' });
	}, [visibleAttendants]);

	const handleFilterChange = useCallback((value: string) => {
		setStatusFilter(previous => (previous === value ? consts.allAttendantsFilter : value));
	}, []);

	const handleShowAll = useCallback(() => {
		setStatusFilter(consts.allAttendantsFilter);
	}, []);

	const headerGradient = event
		? consts.priorityHeaderGradient[event.priority]
		: 'from-gray-700 via-gray-600 to-gray-500';

	return (
		<div className="ui-modal-root" role="dialog" aria-modal="true" aria-labelledby="event-preview-title">
			<div className="ui-modal-center">
				<div className="ui-modal-backdrop" aria-hidden="true" onClick={onClose} />

				<div className="ui-modal-panel z-10 mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden sm:mx-auto">
					<div className={cn('relative bg-gradient-to-br px-5 py-4 sm:px-6 sm:py-5', headerGradient)}>
						<div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
						<div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10" />

						<div className="relative flex items-start gap-3">
							<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl backdrop-blur-sm sm:h-12 sm:w-12 sm:text-2xl">
								{event ? consts.eventTypeEmoji[event.type] : '⏳'}
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
									{strings.eventDetails}
								</p>
								<h2 id="event-preview-title" className="truncate text-lg font-bold text-white sm:text-xl">
									{event ? event.title : strings.loading}
								</h2>
								{event && (
									<div className="mt-2 flex flex-wrap items-center gap-1.5">
										<span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
											{EVENT_TYPE_LABELS[event.type] ?? event.type}
										</span>
										<span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
											{EVENT_PRIORITY_LABELS[event.priority] ?? event.priority}
										</span>
										<Badge tone={getEventStatusTone(event.status)}>
											{EVENT_STATUS_LABELS[event.status] ?? event.status}
										</Badge>
									</div>
								)}
							</div>
							<IconButton onClick={onClose} className="text-white hover:bg-white/20" tooltipText={strings.close}>
								<FiX size={18} />
							</IconButton>
						</div>
					</div>

					<div className="flex-1 overflow-y-auto bg-gray-50 px-5 py-4 sm:px-6">
						{isLoading && !event ? (
							<div className="ui-loading-state">
								<Loader />
							</div>
						) : !event ? (
							<p className="py-8 text-center text-sm text-gray-500">{strings.notFound}</p>
						) : (
							<>
								<div className="ui-card p-4">
									<p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
										{strings.description}
									</p>
									<p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-gray-700">
										{event.description || strings.noDescription}
									</p>
								</div>

								<div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
									<div className="ui-card space-y-3 p-4">
										<DetailRow
											icon={<FiClock className="text-blue-500" />}
											label={strings.startedAt}
											value={format(toDate(event.createdAt), consts.dateTimeFormat)}
										/>
										{event.resolvedAt && (
											<DetailRow
												icon={<FiCheckCircle className="text-green-500" />}
												label={strings.resolvedAt}
												value={format(toDate(event.resolvedAt), consts.dateTimeFormat)}
											/>
										)}
										<DetailRow
											icon={<FiUser className="text-purple-500" />}
											label={strings.reportedBy}
											value={getReferenceName(event.reportedBy) || strings.unknownReporter}
										/>
										{utils.formatCoordinates(event) && (
											<DetailRow
												icon={<FiMapPin className="text-red-500" />}
												label={strings.location}
												value={utils.formatCoordinates(event)}
											/>
										)}
									</div>

									<div className="ui-card p-4">
										<p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
											{strings.departments}
										</p>
										<div className="mt-2 flex flex-wrap gap-1.5">
											{eventDepartments.length === 0 ? (
												<span className="text-sm text-gray-400">{strings.noDepartments}</span>
											) : (
												eventDepartments.map(department => (
													<span
														key={getEntityId(department)}
														className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
													>
														{department.name}
													</span>
												))
											)}
										</div>
									</div>
								</div>

								<div className="ui-card mt-3 overflow-hidden">
									<div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<FiUsers className="text-gray-400" />
												<span className="text-sm font-semibold text-gray-900">{strings.attendants}</span>
												<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
													{strings.attendantsCount(summary.total)}
												</span>
											</div>
											<p className="mt-0.5 text-xs text-gray-400">{strings.attendantsHint}</p>
										</div>
										<span className="text-xs text-gray-400">
											{strings.reportedShare(summary.reported, summary.total)}
										</span>
									</div>

									<div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-4 py-2.5">
										<FilterChip
											label={strings.filterAll}
											count={summary.total}
											isActive={statusFilter === consts.allAttendantsFilter}
											onClick={handleShowAll}
										/>
										{statusFilters.map(status => (
											<FilterChip
												key={status}
												label={RESPONDER_STATUS_LABELS[status]}
												count={summaryByStatus[status]}
												isActive={statusFilter === status}
												onClick={() => handleFilterChange(status)}
											/>
										))}
									</div>

									{attendants.length === 0 ? (
										<p className="px-4 py-6 text-center text-sm text-gray-400">{strings.noAttendants}</p>
									) : visibleAttendants.length === 0 ? (
										<p className="px-4 py-6 text-center text-sm text-gray-400">
											{strings.noAttendantsForFilter}
										</p>
									) : (
										<ul className="divide-y divide-gray-100">
											{visibleAttendants.map(attendant => {
												const isHighlighted =
													!!highlightUserId && getEntityId(attendant.user) === highlightUserId;
												return (
													<li
														key={getEntityId(attendant.user)}
														ref={isHighlighted ? highlightRef : undefined}
														className={cn(
															'flex items-center gap-3 px-4 py-2.5 transition-colors',
															isHighlighted
																? 'bg-blue-50 ring-2 ring-inset ring-blue-400'
																: 'hover:bg-gray-50',
														)}
													>
														<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white">
															{utils.getInitials(attendant.user)}
														</div>
														<div className="min-w-0 flex-1">
															<p className="truncate text-sm font-medium text-gray-900">
																{attendant.user.firstName} {attendant.user.lastName}
															</p>
															<p className="truncate text-xs text-gray-500">
																{attendant.departmentNames.join(' · ') || attendant.user.email}
															</p>
														</div>
														<div className="shrink-0 text-right">
															<Badge tone={getResponderStatusTone(attendant.status)}>
																{RESPONDER_STATUS_LABELS[attendant.status]}
															</Badge>
															<p className="mt-0.5 text-[11px] text-gray-400">
																{attendant.statusUpdate
																	? strings.reportedAt(
																			format(
																				toDate(attendant.statusUpdate.createdAt),
																				consts.dateTimeFormat,
																			),
																		)
																	: strings.neverReported}
															</p>
														</div>
													</li>
												);
											})}
										</ul>
									)}
								</div>
							</>
						)}
					</div>

					<div className="ui-modal-footer flex-none border-t border-gray-200">
						<Button variant="secondary" size="md" onClick={onClose} className="w-full sm:w-auto">
							{strings.close}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default memo(EventPreviewModal);
