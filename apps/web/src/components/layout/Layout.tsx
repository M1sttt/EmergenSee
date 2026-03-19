import { useState, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from 'store/authStore';
import { authService } from 'services/authService';
import { eventsService } from 'services/eventsService';
import { statusService } from 'services/statusService';
import { WebSocketEventType } from '@emergensee/shared';
import { useWebSocket } from 'hooks/useWebSocket';
import { CONSTS } from './consts';
import { STRINGS } from './strings';
import logo from 'assets/logo.png';
import { getRelevantOngoingEvent, hasUserReportedForEvent, getNavigationLinks } from './utils';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const queryClient = useQueryClient();

  useWebSocket(WebSocketEventType.EVENT_CREATED, () => {
    queryClient.invalidateQueries({ queryKey: CONSTS.QUERY_KEYS.EVENTS });
  });
  useWebSocket(WebSocketEventType.EVENT_UPDATED, () => {
    queryClient.invalidateQueries({ queryKey: CONSTS.QUERY_KEYS.EVENTS });
  });
  useWebSocket(WebSocketEventType.EVENT_DELETED, () => {
    queryClient.invalidateQueries({ queryKey: CONSTS.QUERY_KEYS.EVENTS });
  });
  useWebSocket(WebSocketEventType.STATUS_UPDATED as any, () => {
    queryClient.invalidateQueries({ queryKey: CONSTS.QUERY_KEYS.STATUS });
  });

  const { data: events = [] } = useQuery({
    queryKey: CONSTS.QUERY_KEYS.EVENTS,
    queryFn: eventsService.getAll,
  });

  const { data: myStatuses = [] } = useQuery({
    queryKey: [...CONSTS.QUERY_KEYS.STATUS, user?.id],
    queryFn: () => statusService.getByUser(user!.id),
    enabled: !!user?.id,
  });

  const relevantOngoingEvent = useMemo(() => {
    return getRelevantOngoingEvent(events as any, user);
  }, [events, user]);

  const hasRelevantOngoingEvent = !!relevantOngoingEvent;
  const hasReportedForEvent = useMemo(() => {
    if (!relevantOngoingEvent) return false;
    const eventId = relevantOngoingEvent.id || (relevantOngoingEvent as any)._id;
    return hasUserReportedForEvent(eventId, myStatuses);
  }, [relevantOngoingEvent, myStatuses]);

  const navigation = getNavigationLinks(hasRelevantOngoingEvent, hasReportedForEvent);
  const isActive = (path: string) => location.pathname === path;
  const userInitials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

  const CollapseIcon = CONSTS.ICONS.COLLAPSE;
  const ExpandIcon = CONSTS.ICONS.EXPAND;
  const LogoutIcon = CONSTS.ICONS.LOGOUT;

  return (
    <div className={CONSTS.CLASSES.LAYOUT_CONTAINER}>
      <div
        className={`${CONSTS.CLASSES.SIDEBAR_BASE} ${isSidebarExpanded ? CONSTS.CLASSES.SIDEBAR_EXPANDED : CONSTS.CLASSES.SIDEBAR_COLLAPSED
          }`}
      >
        <button
          type="button"
          aria-label={isSidebarExpanded ? STRINGS.COLLAPSE_SIDEBAR : STRINGS.EXPAND_SIDEBAR}
          onClick={() => setIsSidebarExpanded(prev => !prev)}
          className={CONSTS.CLASSES.SIDEBAR_BTN}
        >
          {isSidebarExpanded ? <CollapseIcon /> : <ExpandIcon />}
        </button>

        <div className={CONSTS.CLASSES.SIDEBAR_WRAPPER}>
          <div
            className={`${CONSTS.CLASSES.LOGO_CONTAINER_BASE} ${isSidebarExpanded
              ? CONSTS.CLASSES.LOGO_CONTAINER_EXPANDED
              : CONSTS.CLASSES.LOGO_CONTAINER_COLLAPSED
              }`}
          >
            <div className="flex items-center gap-2">
              <img src={logo} alt={STRINGS.APP_NAME} className="h-12" />
              <h1 className={CONSTS.CLASSES.LOGO_TEXT_EXPANDED}>{isSidebarExpanded && STRINGS.APP_NAME}</h1>
            </div>
            {isSidebarExpanded && <p className={CONSTS.CLASSES.SUBTITLE}>{STRINGS.APP_SUBTITLE}</p>}
          </div>

          <nav
            className={`${CONSTS.CLASSES.NAV_CONTAINER_BASE} ${isSidebarExpanded ? CONSTS.CLASSES.NAV_CONTAINER_EXPANDED : CONSTS.CLASSES.NAV_CONTAINER_COLLAPSED}`}
          >
            {navigation.map(item => {
              const active = isActive(item.href);
              const isEmergency = (item as any).isEmergency;
              const needsPulse = (item as any).needsPulse;

              let baseClasses = CONSTS.CLASSES.NAV_LINK_BASE;
              if (isEmergency) {
                baseClasses +=
                  ' ' +
                  (active
                    ? CONSTS.CLASSES.EMERGENCY_MSG_ACTIVE
                    : `${CONSTS.CLASSES.EMERGENCY_MSG_INACTIVE} ${needsPulse ? CONSTS.CLASSES.EMERGENCY_PULSE : ''}`);
              } else {
                baseClasses +=
                  ' ' + (active ? CONSTS.CLASSES.NORMAL_MSG_ACTIVE : CONSTS.CLASSES.NORMAL_MSG_INACTIVE);
              }

              const { Icon } = item;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={!isSidebarExpanded ? item.name : undefined}
                  className={`${baseClasses} ${isSidebarExpanded ? '' : CONSTS.CLASSES.NAV_LINK_COLLAPSED_EXTRA}`}
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
            className={`${CONSTS.CLASSES.USER_INFO_CONTAINER_BASE} ${isSidebarExpanded ? '' : CONSTS.CLASSES.USER_INFO_CONTAINER_COLLAPSED}`}
          >
            <button
              onClick={() =>
                location.pathname === CONSTS.ROUTES.PROFILE ? navigate(-1) : navigate(CONSTS.ROUTES.PROFILE)
              }
              className={`${CONSTS.CLASSES.USER_BTN_BASE} ${isSidebarExpanded ? CONSTS.CLASSES.USER_BTN_EXPANDED_EXTRA : ''}`}
            >
              {isSidebarExpanded ? (
                <div className={CONSTS.CLASSES.USER_FLEX}>
                  <div className={CONSTS.CLASSES.USER_DETAILS}>
                    <p className={CONSTS.CLASSES.USER_NAME_TEXT}>
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className={CONSTS.CLASSES.USER_EMAIL_TEXT}>{user?.email}</p>
                  </div>
                </div>
              ) : (
                <div className={CONSTS.CLASSES.USER_AVATAR}>{userInitials}</div>
              )}
            </button>

            <button
              onClick={() => authService.logout()}
              className={`${CONSTS.CLASSES.LOGOUT_BTN_BASE} ${isSidebarExpanded ? CONSTS.CLASSES.LOGOUT_BTN_EXPANDED : CONSTS.CLASSES.LOGOUT_BTN_COLLAPSED
                }`}
              title={!isSidebarExpanded ? STRINGS.LOGOUT_TITLE : undefined}
            >
              {isSidebarExpanded ? (
                <>
                  <LogoutIcon />
                  {STRINGS.LOGOUT_TEXT}
                </>
              ) : (
                <LogoutIcon />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={CONSTS.CLASSES.MAIN_CONTENT}>
        <Outlet />
      </div>
    </div>
  );
}
