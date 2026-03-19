import { useState, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from 'store/authStore';
import { authService } from 'services/authService';
import { WebSocketEventType } from '@emergensee/shared';
import { useWebSocket } from 'hooks/useWebSocket';
import { LAYOUT_QUERY_KEYS, useLayoutEventsQuery, useLayoutUserStatusesQuery } from 'hooks/data/useLayoutData';
import logo from 'assets/logo.png';
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
    <div className={consts.layoutContainer}>
      <div
        className={`${consts.sidebarBase} ${isSidebarExpanded ? consts.sidebarExpanded : consts.sidebarCollapsed
          }`}
      >
        <button
          type="button"
          aria-label={isSidebarExpanded ? strings.collapseSidebar : strings.expandSidebar}
          onClick={() => setIsSidebarExpanded(prev => !prev)}
          className={consts.sidebarBtn}
        >
          {isSidebarExpanded ? <CollapseIcon /> : <ExpandIcon />}
        </button>

        <div className={consts.sidebarWrapper}>
          <div
            className={`${consts.logoContainerBase} ${isSidebarExpanded
              ? consts.logoContainerExpanded
              : consts.logoContainerCollapsed
              }`}
          >
            <div className="flex items-center gap-2">
              <img src={logo} alt={strings.appName} className="h-12" />
              <h1 className={consts.logoTextExpanded}>{isSidebarExpanded && strings.appName}</h1>
            </div>
            {isSidebarExpanded && <p className={consts.subtitle}>{strings.appSubtitle}</p>}
          </div>

          <nav
            className={`${consts.navContainerBase} ${isSidebarExpanded ? consts.navContainerExpanded : consts.navContainerCollapsed}`}
          >
            {navigation.map(item => {
              const active = isActive(item.href);
              const isEmergency = (item as any).isEmergency;
              const needsPulse = (item as any).needsPulse;

              let baseClasses = consts.navLinkBase;
              if (isEmergency) {
                baseClasses +=
                  ' ' +
                  (active
                    ? consts.emergencyMsgActive
                    : `${consts.emergencyMsgInactive} ${needsPulse ? consts.emergencyPulse : ''}`);
              } else {
                baseClasses +=
                  ' ' + (active ? consts.normalMsgActive : consts.normalMsgInactive);
              }

              const { Icon } = item;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={!isSidebarExpanded ? item.name : undefined}
                  className={`${baseClasses} ${isSidebarExpanded ? '' : consts.navLinkCollapsedExtra}`}
                >
                  <span className={`${isSidebarExpanded ? 'mr-3' : ''} text-lg`}>
                    <Icon />
                  </span>
                  {isSidebarExpanded && item.name}
                </Link>
              );
            })}
          </nav>

          <div
            className={`${consts.userInfoContainerBase} ${isSidebarExpanded ? '' : consts.userInfoContainerCollapsed}`}
          >
            <button
              onClick={() =>
                location.pathname === consts.profileRoute ? navigate(-1) : navigate(consts.profileRoute)
              }
              className={`${consts.userBtnBase} ${isSidebarExpanded ? consts.userBtnExpandedExtra : ''}`}
            >
              {isSidebarExpanded ? (
                <div className={consts.userFlex}>
                  <div className={consts.userDetails}>
                    <p className={consts.userNameText}>
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className={consts.userEmailText}>{user?.email}</p>
                  </div>
                </div>
              ) : (
                <div className={consts.userAvatar}>{userInitials}</div>
              )}
            </button>

            <button
              onClick={() => authService.logout()}
              className={`${consts.logoutBtnBase} ${isSidebarExpanded ? consts.logoutBtnExpanded : consts.logoutBtnCollapsed
                }`}
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
      <div className={consts.mainContent}>
        <Outlet />
      </div>
    </div>
  );
}
