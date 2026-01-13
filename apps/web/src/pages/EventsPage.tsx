import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '../services/eventsService';
import { Event, EventPriority, EventStatus, EVENT_PRIORITY_LABELS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from '@emergensee/shared';
import { useWebSocket } from '../hooks/useWebSocket';
import { WebSocketEventType } from '@emergensee/shared';
import EventForm from '../components/events/EventForm';

export default function EventsPage() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventsService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: eventsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  // WebSocket listeners
  useWebSocket(WebSocketEventType.EVENT_CREATED, useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
  }, [queryClient]));

  useWebSocket(WebSocketEventType.EVENT_UPDATED, useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
  }, [queryClient]));

  useWebSocket(WebSocketEventType.EVENT_DELETED, useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
  }, [queryClient]));

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedEvent(null);
  };

  const getPriorityColor = (priority: EventPriority) => {
    switch (priority) {
      case EventPriority.CRITICAL:
        return 'bg-red-100 text-red-800';
      case EventPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case EventPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case EventPriority.LOW:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case EventStatus.PENDING:
        return 'bg-gray-100 text-gray-800';
      case EventStatus.DISPATCHED:
        return 'bg-blue-100 text-blue-800';
      case EventStatus.EN_ROUTE:
        return 'bg-purple-100 text-purple-800';
      case EventStatus.ON_SCENE:
        return 'bg-indigo-100 text-indigo-800';
      case EventStatus.RESOLVED:
        return 'bg-green-100 text-green-800';
      case EventStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Event
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{event.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{EVENT_TYPE_LABELS[event.type]}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(event.priority)}`}>
                    {EVENT_PRIORITY_LABELS[event.priority]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(event.status)}`}>
                    {EVENT_STATUS_LABELS[event.status]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{event.address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <EventForm
          event={selectedEvent}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
