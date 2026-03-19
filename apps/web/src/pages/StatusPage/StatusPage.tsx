import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { RiUserUnfollowLine } from 'react-icons/ri';
import { EventStatus, RESPONDER_STATUS_LABELS, ResponderStatus, UserRole } from '@emergensee/shared';
import { useAuthStore } from 'store/authStore';
import { ActionIcon } from '@/components/common/ActionIcon';
import { Loader } from '@/components/common/Loader';
import {
  useStatusPageCreateStatusMutation,
  useStatusPageDepartmentsQuery,
  useStatusPageEventsQuery,
  useStatusPageStatusUpdatesQuery,
  useStatusPageUsersQuery,
} from 'hooks/data/useStatusPageData';
import * as strings from './strings';
import * as consts from './consts';

export default function StatusPage() {
  const currentUser = useAuthStore(state => state.user);

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');

  const { data: events = [], isLoading: isLoadingEvents } = useStatusPageEventsQuery();
  const { data: departments = [], isLoading: isLoadingDepts } = useStatusPageDepartmentsQuery();
  const { data: users = [], isLoading: isLoadingUsers } = useStatusPageUsersQuery();
  const { data: statusUpdates = [], isLoading: isLoadingStatus } = useStatusPageStatusUpdatesQuery();
  const reportMutation = useStatusPageCreateStatusMutation();

  const activeEvents = useMemo(
    () => events.filter(event => event.status === EventStatus.ONGOING),
    [events],
  );

  useEffect(() => {
    if (!selectedEventId && activeEvents.length > 0) {
      setSelectedEventId(activeEvents[0].id || (activeEvents[0] as any)._id);
    }
  }, [activeEvents, selectedEventId]);

  const isGlobalAdmin = currentUser?.role === UserRole.ADMIN;
  const userAdminDepts = departments.filter(department => department.admins?.includes(currentUser?.id || ''));
  const isDeptAdmin = userAdminDepts.length > 0;

  const validDepartments = isGlobalAdmin ? departments : isDeptAdmin ? userAdminDepts : [];

  const displayUsers = useMemo(() => {
    if (!selectedEventId) return [];

    let filteredUsers = users;
    if (selectedDeptId !== 'all') {
      filteredUsers = users.filter(user => user.departments?.includes(selectedDeptId));
    } else if (!isGlobalAdmin && isDeptAdmin) {
      const adminDeptIds = userAdminDepts.map(department => department.id || (department as any)._id);
      filteredUsers = users.filter(user =>
        user.departments?.some(departmentId => adminDeptIds.includes(departmentId)),
      );
    }

    return filteredUsers.map(user => {
      const userStatuses = statusUpdates.filter(statusUpdate => {
        const uid =
          (statusUpdate as any).userId?.id ||
          (statusUpdate as any).userId?._id ||
          (statusUpdate as any).userId;
        const eid =
          (statusUpdate as any).eventId?.id ||
          (statusUpdate as any).eventId?._id ||
          (statusUpdate as any).eventId;
        return uid === user.id && eid === selectedEventId;
      });

      userStatuses.sort(
        (a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime(),
      );

      return {
        user,
        status: userStatuses.length > 0 ? userStatuses[0] : null,
      };
    });
  }, [selectedEventId, selectedDeptId, users, statusUpdates, isGlobalAdmin, isDeptAdmin, userAdminDepts]);

  const isLoading = isLoadingEvents || isLoadingDepts || isLoadingUsers || isLoadingStatus;

  return (
    <div className={consts.containerClass}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">{strings.title}</h1>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">{strings.activeEventLabel}</label>
            <select
              value={selectedEventId}
              onChange={event => setSelectedEventId(event.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 bg-white"
            >
              <option value="" disabled>
                {strings.selectEventPlaceholder}
              </option>
              {activeEvents.map(event => {
                const eventId = event.id || (event as any)._id;
                return (
                  <option key={eventId} value={eventId}>
                    {event.title}
                  </option>
                );
              })}
            </select>
          </div>

          {(isGlobalAdmin || isDeptAdmin) && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{strings.departmentLabel}</label>
              <select
                value={selectedDeptId}
                onChange={event => setSelectedDeptId(event.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 bg-white"
              >
                <option value={consts.allDeptsValue}>{strings.allDepartments}</option>
                {validDepartments.map(department => {
                  const departmentId = department.id || (department as any)._id;
                  return (
                    <option key={departmentId} value={departmentId}>
                      {department.name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </div>

      {!selectedEventId ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          {strings.noActiveEvents}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {strings.columnUser}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {strings.columnStatus}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {strings.columnLastUpdated}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {strings.columnActions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8">
                    <Loader />
                  </td>
                </tr>
              ) : displayUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    {strings.noUsersFound}
                  </td>
                </tr>
              ) : (
                displayUsers.map(({ user, status }) => {
                  const canReport =
                    isGlobalAdmin ||
                    (isDeptAdmin &&
                      (user.departments || []).some(departmentId =>
                        userAdminDepts
                          .map(department => department.id || (department as any)._id)
                          .includes(departmentId),
                      ));

                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {status && status.status !== ResponderStatus.UNKNOWN ? (
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${consts.getStatusStyle(status.status)}`}
                          >
                            {RESPONDER_STATUS_LABELS[
                              status.status as keyof typeof RESPONDER_STATUS_LABELS
                            ] || status.status}
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {RESPONDER_STATUS_LABELS[
                              ResponderStatus.UNKNOWN as keyof typeof RESPONDER_STATUS_LABELS
                            ] || strings.unknownStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {status ? format(new Date((status as any).createdAt), consts.dateFormat) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canReport && (
                          <div className="flex justify-end gap-2">
                            <ActionIcon
                              onClick={() =>
                                reportMutation.mutate({
                                  status: ResponderStatus.SAFE,
                                  userId: user.id,
                                  eventId: selectedEventId,
                                })
                              }
                              className="text-green-600"
                              tooltipText={strings.markSafe}
                            >
                              <FiCheckCircle size={16} />
                            </ActionIcon>
                            <ActionIcon
                              onClick={() =>
                                reportMutation.mutate({
                                  status: ResponderStatus.NEED_HELP,
                                  userId: user.id,
                                  eventId: selectedEventId,
                                })
                              }
                              className="text-red-600"
                              tooltipText={strings.markNeedHelp}
                            >
                              <FiAlertTriangle size={16} />
                            </ActionIcon>
                            <ActionIcon
                              onClick={() =>
                                reportMutation.mutate({
                                  status: ResponderStatus.AWAY,
                                  userId: user.id,
                                  eventId: selectedEventId,
                                })
                              }
                              className="text-orange-700"
                              tooltipText="Mark Away"
                            >
                              <RiUserUnfollowLine size={16} />
                            </ActionIcon>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
