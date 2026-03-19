import React, { useMemo, useCallback } from 'react';
import { useWebSocket } from 'hooks/useWebSocket';
import { WebSocketEventType, EventPriority } from '@emergensee/shared';
import { getEventPriorityTone } from '@/consts/ui';
import { MdEvent, MdWarning, MdError, MdNotificationImportant } from 'react-icons/md';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';
import { Loader } from '@/components/common/Loader';
import { Badge } from '@/components/ui';
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

  const activeEventsCount = useMemo(() => utils.getActiveEventsCount(events), [events]);
  const criticalEventsCount = useMemo(
    () => utils.getEventsByPriorityCount(events, EventPriority.CRITICAL),
    [events],
  );
  const highPriorityEventsCount = useMemo(
    () => utils.getEventsByPriorityCount(events, EventPriority.HIGH),
    [events],
  );
  const recentEvents = useMemo(() => events.slice(0, consts.recentItemsLimit), [events]);
  const recentStatusUpdates = useMemo(() => statusUpdates.slice(0, consts.recentItemsLimit), [statusUpdates]);

  const isLoading = isLoadingEvents || isLoadingStatus;

  if (isErrorEvents || isErrorStatus) {
    return <div className="p-6 text-red-600">{strings.errorEvents}</div>;
  }

  return (
    <div className="ui-page">
      <h1 className="ui-page-title mb-6">{strings.title}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <MdEvent className="text-xl" />
            {strings.totalEvents}
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{events.length}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <MdWarning className="text-xl text-blue-600" />
            {strings.activeEvents}
          </div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{activeEventsCount}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <MdError className="text-xl text-red-600" />
            {strings.criticalEvents}
          </div>
          <div className="text-3xl font-bold text-red-600 mt-2">{criticalEventsCount}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <MdNotificationImportant className="text-xl text-orange-600" />
            {strings.highPriority}
          </div>
          <div className="text-3xl font-bold text-orange-600 mt-2">{highPriorityEventsCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{strings.recentEvents}</h2>
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
                    <Badge tone={getEventPriorityTone(event.priority)}>
                      {event.priority}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{strings.recentStatusUpdates}</h2>
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
                      <h3 className="font-semibold text-gray-900">{strings.statusUpdate}</h3>
                      <p className="text-sm text-gray-600">{status.notes || strings.noNotes}</p>
                    </div>
                    <Badge tone="info">{status.status}</Badge>
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
