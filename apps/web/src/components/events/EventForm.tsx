import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { eventsService } from '../../services/eventsService';
import { departmentsService } from '../../services/departmentsService';
import { Event, CreateEventDto, UpdateEventDto, EventType, EventPriority } from '@emergensee/shared';

interface EventFormProps {
  event?: Event | null;
  onClose: () => void;
}

export default function EventForm({ event, onClose }: EventFormProps) {
  const queryClient = useQueryClient();

  const { data: departmentsResponse } = useQuery<any>({
    queryKey: ['departments'],
    queryFn: departmentsService.getAll,
  });
  const departments: any[] = Array.isArray(departmentsResponse) ? departmentsResponse : (departmentsResponse?.data || []);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateEventDto>({
    defaultValues: event ? {
      type: event.type,
      priority: event.priority,
      title: event.title,
      description: event.description,
      location: event.location,
      departments: event.departments,
    } : undefined,
  });

  const createMutation = useMutation({
    mutationFn: eventsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventDto }) =>
      eventsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
  });

  const onSubmit = (data: CreateEventDto) => {
    // For demo purposes, using a default location if not provided
    const formData = {
      ...data,
      location: data.location || {
        type: 'Point' as const,
        coordinates: [-74.006, 40.7128], // Default to NYC
      },
    };

    if (event) {
      updateMutation.mutate({ id: event.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {event ? 'Edit Event' : 'Create Event'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              {...register('title', { required: 'Title is required' })}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              {...register('type', { required: 'Type is required' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select type</option>
              {Object.values(EventType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              {...register('priority', { required: 'Priority is required' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select priority</option>
              {Object.values(EventPriority).map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Departments (Hold Ctrl/Cmd to select multiple)</label>
            <select
              multiple
              {...register('departments', { required: 'At least one department is required' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-24"
            >
              {departments.map((dept: any) => (
                <option key={dept.id || dept._id} value={dept.id || dept._id}>{dept.name}</option>
              ))}
            </select>
            {errors.departments && (
              <p className="mt-1 text-sm text-red-600">{errors.departments.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              {event ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
