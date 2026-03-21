import { useEffect, useMemo, useState } from 'react';
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
import { getEntityId, toDate } from '@/types/entities';
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

  const activeEventIds = useMemo(
    () => new Set(activeEvents.map(event => getEntityId(event))),
    [activeEvents],
  );

  const effectiveSelectedEventId = useMemo(() => {
    if (selectedEventId && activeEventIds.has(selectedEventId)) return selectedEventId;
    return activeEvents.length > 0 ? getEntityId(activeEvents[0]) : '';
  }, [activeEventIds, activeEvents, selectedEventId]);

  const selectedActiveEvent = useMemo(
    () => activeEvents.find(event => getEntityId(event) === effectiveSelectedEventId) || null,
    [activeEvents, effectiveSelectedEventId],
  );

  const activeEventDepartmentIds = useMemo(
    () => new Set((selectedActiveEvent?.departments || []).map(department => getEntityId(department))),
    [selectedActiveEvent],
  );

  const isGlobalAdmin = currentUser?.role === UserRole.ADMIN;
  const userAdminDepts = departments.filter(department => department.admins?.includes(currentUser?.id || ''));
  const isDeptAdmin = userAdminDepts.length > 0;

  const eventRelatedDepartments = useMemo(
    () =>
      departments.filter(department => activeEventDepartmentIds.has(getEntityId(department))),
    [activeEventDepartmentIds, departments],
  );

  const eventOptions = useMemo(
    () =>
      activeEvents.map(event => ({
        value: getEntityId(event),
        label: event.title,
      })),
    [activeEvents],
  );

  const departmentOptions = useMemo(
    () => {
      if (!effectiveSelectedEventId || eventRelatedDepartments.length === 0) {
        return [];
      }

      return [
        { value: consts.allDeptsValue, label: strings.allDepartments },
        ...eventRelatedDepartments.map(department => ({
          value: getEntityId(department),
          label: department.name,
        })),
      ];
    },
    [effectiveSelectedEventId, eventRelatedDepartments],
  );

  useEffect(() => {
    if (!effectiveSelectedEventId) {
      setSelectedDeptId(consts.allDeptsValue);
      return;
    }

    if (selectedDeptId !== consts.allDeptsValue && !activeEventDepartmentIds.has(selectedDeptId)) {
      setSelectedDeptId(consts.allDeptsValue);
    }
  }, [activeEventDepartmentIds, effectiveSelectedEventId, selectedDeptId]);

  const displayUsers = useMemo(() => {
    if (!effectiveSelectedEventId) return [];

    let filteredUsers = users.filter(user =>
      user.departments?.some(departmentId => activeEventDepartmentIds.has(getEntityId(departmentId))),
    );

    if (selectedDeptId !== consts.allDeptsValue) {
      filteredUsers = filteredUsers.filter(user =>
        user.departments?.some(departmentId => getEntityId(departmentId) === selectedDeptId),
      );
    }

    return filteredUsers.map(user => {
      const userStatuses = statusUpdates.filter(statusUpdate => {
        const uid = getEntityId(statusUpdate.userId);
        const eid = getEntityId(statusUpdate.eventId);
        return uid === user.id && eid === effectiveSelectedEventId;
      });

      userStatuses.sort(
        (a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime(),
      );

      return {
        user,
        status: userStatuses.length > 0 ? userStatuses[0] : null,
      };
    });
  }, [activeEventDepartmentIds, effectiveSelectedEventId, selectedDeptId, users, statusUpdates]);

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
            {status ? format(toDate(status.createdAt), consts.dateFormat) : '-'}
          </div>
        ),
      },
      {
        id: 'actions',
        header: strings.columnActions,
        headerClassName: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        cellClassName: 'px-6 py-4 whitespace-nowrap text-left text-sm font-medium',
        renderCell: ({ user }) => {
          const canReport =
            isGlobalAdmin ||
            (isDeptAdmin &&
              (user.departments || []).some(departmentId =>
                userAdminDepts
                  .map(getEntityId)
                  .includes(departmentId),
              ));

          if (!canReport) return null;

          return (
            <div className="flex justify-start gap-2">
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
                isDisabled={!effectiveSelectedEventId || departmentOptions.length === 0}
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
