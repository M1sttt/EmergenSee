import React, { useMemo, useCallback } from 'react';
import { useWebSocket } from 'hooks/useWebSocket';
import { WebSocketEventType, EventPriority } from '@emergensee/shared';
import { MdEvent, MdWarning, MdError, MdNotificationImportant } from 'react-icons/md';
import { DASHBOARD_STRINGS } from './strings';
import { RECENT_ITEMS_LIMIT, PRIORITY_STYLES, COMMON_STATUS_STYLE } from './consts';
import { getActiveEventsCount, getEventsByPriorityCount } from './utils';
import { Loader } from '@/components/common/Loader';
import { useDashboardPageEventsQuery, useDashboardPageStatusQuery } from 'hooks/data/useDashboardPageData';

const DashboardPage: React.FC = () => {
	const {
		data: events = [],
		refetch: refetchEvents,
		isLoading: isLoadingEvents,
		isError: isErrorEvents,
	} = useDashboardPageEventsQuery();

	const {
		data: statusUpdates = [],
		refetch: refetchStatus,
		isLoading: isLoadingStatus,
		isError: isErrorStatus,
	} = useDashboardPageStatusQuery();

	const handleRefetchEvents = useCallback(() => {
		refetchEvents();
	}, [refetchEvents]);

	const handleRefetchStatus = useCallback(() => {
		refetchStatus();
	}, [refetchStatus]);

	useWebSocket(WebSocketEventType.EVENT_CREATED, handleRefetchEvents);
	useWebSocket(WebSocketEventType.EVENT_UPDATED, handleRefetchEvents);
	useWebSocket(WebSocketEventType.STATUS_UPDATED, handleRefetchStatus);

	const activeEventsCount = useMemo(() => getActiveEventsCount(events), [events]);
	const criticalEventsCount = useMemo(
		() => getEventsByPriorityCount(events, EventPriority.CRITICAL),
		[events],
	);
	const highPriorityEventsCount = useMemo(
		() => getEventsByPriorityCount(events, EventPriority.HIGH),
		[events],
	);
	const recentEvents = useMemo(() => events.slice(0, RECENT_ITEMS_LIMIT), [events]);
	const recentStatusUpdates = useMemo(() => statusUpdates.slice(0, RECENT_ITEMS_LIMIT), [statusUpdates]);

	const isLoading = isLoadingEvents || isLoadingStatus;

	if (isErrorEvents || isErrorStatus) {
		return <div className="p-6 text-red-600">{DASHBOARD_STRINGS.ERROR_EVENTS}</div>;
	}

	return (
		<div className="p-6">
			<h1 className="text-3xl font-bold text-gray-900 mb-6">{DASHBOARD_STRINGS.TITLE}</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center gap-2 text-sm font-medium text-gray-600">
						<MdEvent className="text-xl" />
						{DASHBOARD_STRINGS.TOTAL_EVENTS}
					</div>
					<div className="text-3xl font-bold text-gray-900 mt-2">{events.length}</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center gap-2 text-sm font-medium text-gray-600">
						<MdWarning className="text-xl text-blue-600" />
						{DASHBOARD_STRINGS.ACTIVE_EVENTS}
					</div>
					<div className="text-3xl font-bold text-blue-600 mt-2">{activeEventsCount}</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center gap-2 text-sm font-medium text-gray-600">
						<MdError className="text-xl text-red-600" />
						{DASHBOARD_STRINGS.CRITICAL_EVENTS}
					</div>
					<div className="text-3xl font-bold text-red-600 mt-2">{criticalEventsCount}</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<div className="flex items-center gap-2 text-sm font-medium text-gray-600">
						<MdNotificationImportant className="text-xl text-orange-600" />
						{DASHBOARD_STRINGS.HIGH_PRIORITY}
					</div>
					<div className="text-3xl font-bold text-orange-600 mt-2">{highPriorityEventsCount}</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-white rounded-lg shadow">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-xl font-semibold text-gray-900">{DASHBOARD_STRINGS.RECENT_EVENTS}</h2>
					</div>
					<div className="p-6">
						{isLoading ? (
							<Loader />
						) : recentEvents.length === 0 ? (
							<div className="text-gray-500">No recent events.</div>
						) : (
							recentEvents.map(event => (
								<div
									key={event.id}
									className="mb-4 pb-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
								>
									<div className="flex justify-between items-start">
										<div>
											<h3 className="font-semibold text-gray-900">{event.title}</h3>
										</div>
										<span
											className={`px-2 py-1 text-xs font-semibold rounded ${PRIORITY_STYLES[event.priority] || 'bg-gray-100 text-gray-800'}`}
										>
											{event.priority}
										</span>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				<div className="bg-white rounded-lg shadow">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-xl font-semibold text-gray-900">{DASHBOARD_STRINGS.RECENT_STATUS_UPDATES}</h2>
					</div>
					<div className="p-6">
						{isLoading ? (
							<Loader />
						) : recentStatusUpdates.length === 0 ? (
							<div className="text-gray-500">No recent status updates.</div>
						) : (
							recentStatusUpdates.map(status => (
								<div
									key={status.id}
									className="mb-4 pb-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
								>
									<div className="flex justify-between items-start">
										<div>
											<h3 className="font-semibold text-gray-900">{DASHBOARD_STRINGS.STATUS_UPDATE}</h3>
											<p className="text-sm text-gray-600">{status.notes || DASHBOARD_STRINGS.NO_NOTES}</p>
										</div>
										<span className={COMMON_STATUS_STYLE}>{status.status}</span>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default React.memo(DashboardPage);
