import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { RiUserUnfollowLine } from 'react-icons/ri';
import { EventStatus, RESPONDER_STATUS_LABELS, ResponderStatus, UserRole } from '@emergensee/shared';
import { getResponderStatusTone } from '@/consts/ui';
import { useAuthStore } from 'store/authStore';
import GenericTable, { type GenericTableColumn } from '@/components/common/GenericTable';
import SelectDropdown from '@/components/SelectDropdown';
import { Loader } from '@/components/common/Loader';
import { Badge, IconButton, Label } from '@/components/ui';
import {
  useStatusPageCreateStatusMutation,
  useStatusPageDepartmentsQuery,
  useStatusPageEventsQuery,
  useStatusPageStatusUpdatesQuery,
  useStatusPageUsersQuery,
} from 'hooks/data/useStatusPageData';
import { getEntityId } from './utils';
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

  const effectiveSelectedEventId = useMemo(() => {
    if (selectedEventId) return selectedEventId;
    return activeEvents.length > 0 ? getEntityId(activeEvents[0]) : '';
  }, [activeEvents, selectedEventId]);

  const isGlobalAdmin = currentUser?.role === UserRole.ADMIN;
  const userAdminDepts = departments.filter(department => department.admins?.includes(currentUser?.id || ''));
  const isDeptAdmin = userAdminDepts.length > 0;

  const validDepartments = isGlobalAdmin ? departments : isDeptAdmin ? userAdminDepts : [];

  const eventOptions = useMemo(
    () =>
      activeEvents.map(event => ({
        value: getEntityId(event),
        label: event.title,
      })),
    [activeEvents],
  );

  const departmentOptions = useMemo(
    () => [
      { value: consts.allDeptsValue, label: strings.allDepartments },
      ...validDepartments.map(department => ({
        value: department.id || (department as any)._id || '',
        label: department.name,
      })),
    ],
    [validDepartments],
  );

  const displayUsers = useMemo(() => {
    if (!effectiveSelectedEventId) return [];

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
        const statusRecord = statusUpdate as {
          userId?: unknown;
          eventId?: unknown;
        };

        const uid = getEntityId(statusRecord.userId);
        const eid = getEntityId(statusRecord.eventId);
        return uid === user.id && eid === effectiveSelectedEventId;
      });

      userStatuses.sort(
        (a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime(),
      );

      return {
        user,
        status: userStatuses.length > 0 ? userStatuses[0] : null,
      };
    });
  }, [effectiveSelectedEventId, selectedDeptId, users, statusUpdates, isGlobalAdmin, isDeptAdmin, userAdminDepts]);

  const isLoading = isLoadingEvents || isLoadingDepts || isLoadingUsers || isLoadingStatus;

  const statusColumns = useMemo<GenericTableColumn<(typeof displayUsers)[number]>[]>(
    () => [
      {
        id: 'user',
        header: strings.columnUser,
        renderCell: ({ user }) => (
          <div className="text-sm font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </div>
        ),
      },
      {
        id: 'phoneNumber',
        header: strings.columnPhoneNumber,
        renderCell: ({ user }) => (
          <div className="text-sm text-gray-500">{user.phoneNumber || strings.emptyPhone}</div>
        ),
      },
      {
        id: 'status',
        header: strings.columnStatus,
        renderCell: ({ status }) =>
          status && status.status !== ResponderStatus.UNKNOWN ? (
            <Badge tone={getResponderStatusTone(status.status)}>
              {RESPONDER_STATUS_LABELS[
                status.status as keyof typeof RESPONDER_STATUS_LABELS
              ] || status.status}
            </Badge>
          ) : (
            <Badge tone="neutral">
              {RESPONDER_STATUS_LABELS[
                ResponderStatus.UNKNOWN as keyof typeof RESPONDER_STATUS_LABELS
              ] || strings.unknownStatus}
            </Badge>
          ),
      },
      {
        id: 'lastUpdated',
        header: strings.columnLastUpdated,
        renderCell: ({ status }) => (
          <div className="text-sm text-gray-500">
            {status ? format(new Date((status as any).createdAt), consts.dateFormat) : '-'}
          </div>
        ),
      },
      {
        id: 'actions',
        header: strings.columnActions,
        headerClassName: 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
        cellClassName: 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium',
        renderCell: ({ user }) => {
          const canReport =
            isGlobalAdmin ||
            (isDeptAdmin &&
              (user.departments || []).some(departmentId =>
                userAdminDepts
                  .map(department => department.id || (department as any)._id)
                  .includes(departmentId),
              ));

          if (!canReport) return null;

          return (
            <div className="flex justify-end gap-2">
              <IconButton
                onClick={() =>
                  reportMutation.mutate({
                    status: ResponderStatus.SAFE,
                    userId: user.id,
                    eventId: effectiveSelectedEventId,
                  })
                }
                className="text-green-600"
                tooltipText={strings.markSafe}
              >
                <FiCheckCircle size={16} />
              </IconButton>
              <IconButton
                onClick={() =>
                  reportMutation.mutate({
                    status: ResponderStatus.NEED_HELP,
                    userId: user.id,
                    eventId: effectiveSelectedEventId,
                  })
                }
                className="text-red-600"
                tooltipText={strings.markNeedHelp}
              >
                <FiAlertTriangle size={16} />
              </IconButton>
              <IconButton
                onClick={() =>
                  reportMutation.mutate({
                    status: ResponderStatus.AWAY,
                    userId: user.id,
                    eventId: effectiveSelectedEventId,
                  })
                }
                className="text-orange-700"
                tooltipText={strings.markAway}
              >
                <RiUserUnfollowLine size={16} />
              </IconButton>
            </div>
          );
        },
      },
    ],
    [effectiveSelectedEventId, isDeptAdmin, isGlobalAdmin, reportMutation, userAdminDepts],
  );

  return (
    <div className="ui-page">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="ui-page-title">{strings.title}</h1>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Label>{strings.activeEventLabel}</Label>
            <SelectDropdown
              value={effectiveSelectedEventId}
              onChange={value => setSelectedEventId(Array.isArray(value) ? '' : value)}
              options={eventOptions}
              placeholder={strings.selectEventPlaceholder}
              isSearchable={false}
              isClearable={false}
              isDisabled={eventOptions.length === 0}
              containerClassName="min-w-[220px]"
            />
          </div>

          {(isGlobalAdmin || isDeptAdmin) && (
            <div className="flex items-center gap-2">
              <Label>{strings.departmentLabel}</Label>
              <SelectDropdown
                value={selectedDeptId}
                onChange={value =>
                  setSelectedDeptId(
                    Array.isArray(value) || !value ? consts.allDeptsValue : value,
                  )
                }
                options={departmentOptions}
                isSearchable={false}
                isClearable={false}
                containerClassName="min-w-[220px]"
              />
            </div>
          )}
        </div>
      </div>

      {!effectiveSelectedEventId ? (
        <div className="ui-empty-state">
          {strings.noActiveEvents}
        </div>
      ) : (
        <GenericTable
          columns={statusColumns}
          rows={displayUsers}
          getRowKey={({ user }) => user.id}
          isLoading={isLoading}
          loadingContent={
            <div className="ui-loading-state">
              <Loader />
            </div>
          }
          emptyContent={strings.noUsersFound}
        />
      )}
    </div>
  );
}
