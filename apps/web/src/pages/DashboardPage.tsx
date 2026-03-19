import { useQuery } from '@tanstack/react-query';
import { eventsService } from '../services/eventsService';
import { statusService } from '../services/statusService';
import { EventStatus, EventPriority } from '@emergensee/shared';
import { useWebSocket } from '../hooks/useWebSocket';
import { WebSocketEventType } from '@emergensee/shared';
import { useCallback } from 'react';

export default function DashboardPage() {
  const { data: events = [], refetch: refetchEvents } = useQuery({
    queryKey: ['events'],
    queryFn: eventsService.getAll,
  });

  const { data: statusUpdates = [], refetch: refetchStatus } = useQuery({
    queryKey: ['status'],
    queryFn: statusService.getAll,
  });

  // WebSocket listeners
  useWebSocket(WebSocketEventType.EVENT_CREATED, useCallback(() => {
    refetchEvents();
  }, [refetchEvents]));

  useWebSocket(WebSocketEventType.EVENT_UPDATED, useCallback(() => {
    refetchEvents();
  }, [refetchEvents]));

  useWebSocket(WebSocketEventType.STATUS_UPDATED, useCallback(() => {
    refetchStatus();
  }, [refetchStatus]));

  const activeEvents = events.filter((e) => e.status !== EventStatus.RESOLVED && e.status !== EventStatus.CANCELLED);
  const criticalEvents = events.filter((e) => e.priority === EventPriority.CRITICAL);
  const highPriorityEvents = events.filter((e) => e.priority === EventPriority.HIGH);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Total Events</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{events.length}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Active Events</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{activeEvents.length}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Critical Events</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{criticalEvents.length}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">High Priority</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">{highPriorityEvents.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
          </div>
          <div className="p-6">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${event.priority === EventPriority.CRITICAL
                        ? 'bg-red-100 text-red-800'
                        : event.priority === EventPriority.HIGH
                          ? 'bg-orange-100 text-orange-800'
                          : event.priority === EventPriority.MEDIUM
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                  >
                    {event.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Status Updates</h2>
          </div>
          <div className="p-6">
            {statusUpdates.slice(0, 5).map((status) => (
              <div key={status.id} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">Status Update</h3>
                    <p className="text-sm text-gray-600">{status.notes || 'No notes'}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                    {status.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
