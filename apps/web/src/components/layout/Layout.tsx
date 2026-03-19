import { useState, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from 'store/authStore';
import { authService } from 'services/authService';
import { WebSocketEventType } from '@emergensee/shared';
import { useWebSocket } from 'hooks/useWebSocket';
import { LAYOUT_QUERY_KEYS, useLayoutEventsQuery, useLayoutUserStatusesQuery } from 'hooks/data/useLayoutData';
import logo from 'assets/logo.png';
import { cn } from '@/utils/cn';
import * as consts from './consts';
import * as strings from './strings';
import * as utils from './utils';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const queryClient = useQueryClient();

  useWebSocket(WebSocketEventType.EVENT_CREATED, () => {
    queryClient.invalidateQueries({ queryKey: LAYOUT_QUERY_KEYS.events });
  });
  useWebSocket(WebSocketEventType.EVENT_UPDATED, () => {
    queryClient.invalidateQueries({ queryKey: LAYOUT_QUERY_KEYS.events });
  });
  useWebSocket(WebSocketEventType.EVENT_DELETED, () => {
    queryClient.invalidateQueries({ queryKey: LAYOUT_QUERY_KEYS.events });
  });
  useWebSocket(WebSocketEventType.STATUS_UPDATED, () => {
    queryClient.invalidateQueries({ queryKey: LAYOUT_QUERY_KEYS.status });
  });

  const { data: events = [] } = useLayoutEventsQuery();

  const { data: myStatuses = [] } = useLayoutUserStatusesQuery(user?.id);

  const relevantOngoingEvent = useMemo(() => {
    return utils.getRelevantOngoingEvent(events as any, user);
  }, [events, user]);

  const hasRelevantOngoingEvent = !!relevantOngoingEvent;
  const hasReportedForEvent = useMemo(() => {
    if (!relevantOngoingEvent) return false;
    const eventId = relevantOngoingEvent.id || (relevantOngoingEvent as any)._id;
    return utils.hasUserReportedForEvent(eventId, myStatuses);
  }, [relevantOngoingEvent, myStatuses]);

  const navigation = utils.getNavigationLinks(hasRelevantOngoingEvent, hasReportedForEvent);
  const isActive = (path: string) => location.pathname === path;
  const userInitials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

  const CollapseIcon = consts.collapseIcon;
  const ExpandIcon = consts.expandIcon;
  const LogoutIcon = consts.logoutIcon;

  return (
    <div className="flex h-screen bg-gray-100">
      <div
        className={cn(
          'relative bg-white shadow-lg transition-all duration-200',
          isSidebarExpanded ? 'w-64' : 'w-20',
        )}
      >
        <button
          type="button"
          aria-label={isSidebarExpanded ? strings.collapseSidebar : strings.expandSidebar}
          onClick={() => setIsSidebarExpanded(prev => !prev)}
          className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-600 shadow-sm hover:bg-gray-50"
        >
          {isSidebarExpanded ? <CollapseIcon /> : <ExpandIcon />}
        </button>

        <div className="flex h-full flex-col">
          <div className={cn('border-b border-gray-200 py-4', isSidebarExpanded ? 'px-6' : 'px-3 text-center')}>
            <div className="flex items-center gap-2">
              <img src={logo} alt={strings.appName} className="h-12" />
              <h1 className="text-2xl font-bold text-blue-600">{isSidebarExpanded && strings.appName}</h1>
            </div>
            {isSidebarExpanded && <p className="mt-1 justify-self-center text-xs text-gray-600">{strings.appSubtitle}</p>}
          </div>

          <nav className={cn('flex-1 space-y-1 py-4', isSidebarExpanded ? 'px-4' : 'px-2')}>
            {navigation.map(item => {
              const active = isActive(item.href);
              const isEmergency = (item as any).isEmergency;
              const needsPulse = (item as any).needsPulse;

              const baseClasses = cn(
                'flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isEmergency
                  ? active
                    ? 'bg-red-600 text-white'
                    : cn('bg-red-500 text-white shadow-md hover:bg-red-600', needsPulse && 'animate-pulse')
                  : active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50',
              );

              const { Icon } = item;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={!isSidebarExpanded ? item.name : undefined}
                  className={cn(baseClasses, !isSidebarExpanded && 'justify-center px-2')}
                >
                  <span className={cn('text-lg', isSidebarExpanded && 'mr-3')}>
                    <Icon />
                  </span>
                  {isSidebarExpanded && item.name}
                </Link>
              );
            })}
          </nav>

          <div className={cn('border-t border-gray-200 px-4 py-4', !isSidebarExpanded && 'text-center')}>
            <button
              onClick={() =>
                location.pathname === consts.profileRoute ? navigate(-1) : navigate(consts.profileRoute)
              }
              className={cn('block w-full rounded-lg text-left hover:bg-gray-50', isSidebarExpanded && '-mx-2 p-2')}
            >
              {isSidebarExpanded ? (
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-600">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                  {userInitials}
                </div>
              )}
            </button>

            <button
              onClick={() => authService.logout()}
              className={cn(
                'mt-3 flex w-full items-center justify-center rounded-lg bg-gray-100 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200',
                isSidebarExpanded ? 'gap-2 px-4 py-2' : 'px-2 py-2',
              )}
              title={!isSidebarExpanded ? strings.logoutTitle : undefined}
            >
              {isSidebarExpanded ? (
                <>
                  <LogoutIcon />
                  {strings.logoutText}
                </>
              ) : (
                <LogoutIcon />
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
