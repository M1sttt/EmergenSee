import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { statusService } from '../services/statusService';
import { eventsService } from '../services/eventsService';
import { useAuthStore } from '../store/authStore';
import { EventStatus, ResponderStatus } from '@emergensee/shared';

export default function EmergencyReportPage() {
  const user = useAuthStore((state) => state.user);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventsService.getAll,
  });

  const ongoingRelatedEvent = useMemo(() => {
    return events.find(
      (event) =>
        event.status === EventStatus.ONGOING &&
        event.departments?.some((dept) => {
          const deptId = typeof dept === 'string' ? dept : (dept as any)._id || (dept as any).id;
          return user?.departments?.some((userDept) => {
            const userDeptId = typeof userDept === 'string' ? userDept : (userDept as any)._id || (userDept as any).id;
            return deptId === userDeptId;
          });
        })
    );
  }, [events, user]);

  const reportMutation = useMutation({
    mutationFn: (status: ResponderStatus) => {
      if (!ongoingRelatedEvent) throw new Error('No ongoing event found');
      return statusService.create({
        status,
        eventId: ongoingRelatedEvent.id || (ongoingRelatedEvent as any)._id,
      });
    },
    onSuccess: (_, variables) => {
      if (variables === ResponderStatus.SAFE) {
        setSuccessMessage('Successfully reported as SAFE. Stay safe out there.');
      } else if (variables === ResponderStatus.NEED_HELP) {
        setSuccessMessage('Emergency signal sent. Help is on the way.');
      }
      setTimeout(() => setSuccessMessage(null), 5000);
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!ongoingRelatedEvent) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">No Active Emergency</h2>
        <p className="text-gray-600 mt-2">There are currently no ongoing events requiring a report.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 p-6 flex flex-col items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full text-center border-t-4 border-red-600">
        <h1 className="text-4xl font-bold text-red-600 mb-2">Emergency Report</h1>
        <p className="text-gray-700 mb-6 text-lg">
          An ongoing event (<strong>{ongoingRelatedEvent.title}</strong>) is currently active in your department. Please report your status immediately.
        </p>

        {successMessage && (
          <div className="mb-6 p-4 rounded-md bg-blue-50 text-blue-800 font-medium">
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={() => reportMutation.mutate(ResponderStatus.SAFE)}
            disabled={reportMutation.isPending}
            className="w-full py-6 bg-green-500 hover:bg-green-600 text-white font-bold text-2xl rounded-xl shadow-lg transform transition active:scale-95 disabled:opacity-50"
          >
            I AM SAFE
          </button>

          <button
            onClick={() => reportMutation.mutate(ResponderStatus.NEED_HELP)}
            disabled={reportMutation.isPending}
            className="w-full py-6 bg-red-600 hover:bg-red-700 text-white font-bold text-2xl rounded-xl shadow-lg transform transition active:scale-95 disabled:opacity-50"
          >
            I NEED HELP
          </button>
        </div>
      </div>
    </div>
  );
}
