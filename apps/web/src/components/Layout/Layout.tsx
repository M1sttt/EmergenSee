import { useState, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from 'store/authStore';
import { authService } from 'services/authService';
import { WebSocketEventType } from '@emergensee/shared';
import { useWebSocket } from 'hooks/useWebSocket';
import {
	LAYOUT_QUERY_KEYS,
	useLayoutEventsQuery,
	useLayoutUserStatusesQuery,
} from 'hooks/data/useLayoutData';
import logo from 'assets/logo.png';
import { cn } from '@/utils/cn';
import { getEntityId } from '@/types/entities';
import { SidebarNavigation } from './SidebarNavigation';
import * as consts from './consts';
import * as strings from './strings';
import * as utils from './utils';

export default function Layout() {
	const location = useLocation();
	const navigate = useNavigate();
	const user = useAuthStore(state => state.user);
	const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
		return utils.getRelevantOngoingEvent(events, user);
	}, [events, user]);

	const hasRelevantOngoingEvent = !!relevantOngoingEvent;
	const hasReportedForEvent = useMemo(() => {
		if (!relevantOngoingEvent) return false;
		const eventId = getEntityId(relevantOngoingEvent);
		return utils.hasUserReportedForEvent(eventId, myStatuses);
	}, [relevantOngoingEvent, myStatuses]);
	const shouldShowEmergencyHeader = hasRelevantOngoingEvent && !hasReportedForEvent;

	const navigation = utils.getNavigationLinks(hasRelevantOngoingEvent, hasReportedForEvent);
	const userInitials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

	const CollapseIcon = consts.collapseIcon;
	const ExpandIcon = consts.expandIcon;
	const LogoutIcon = consts.logoutIcon;
	const MenuIcon = consts.menuIcon;
	const CloseIcon = consts.closeIcon;

	return (
		<div className="flex h-screen bg-gray-100">
			{isMobileSidebarOpen && (
				<button
					type="button"
					aria-label={strings.closeSidebar}
					onClick={() => setIsMobileSidebarOpen(false)}
					className="fixed inset-0 z-30 bg-black/40 lg:hidden"
				/>
			)}

			<div
				className={cn(
					'fixed inset-y-0 left-0 z-40 bg-white shadow-lg transition-all duration-200 lg:relative lg:inset-auto',
					isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
					isSidebarExpanded ? 'w-64 lg:w-64' : 'w-64 lg:w-20',
				)}
			>
				<button
					type="button"
					aria-label={isSidebarExpanded ? strings.collapseSidebar : strings.expandSidebar}
					onClick={() => setIsSidebarExpanded(prev => !prev)}
					className="absolute -right-3 top-8 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-600 shadow-sm hover:bg-gray-50 lg:flex"
				>
					{isSidebarExpanded ? <CollapseIcon /> : <ExpandIcon />}
				</button>

				<button
					type="button"
					aria-label={strings.closeSidebar}
					onClick={() => setIsMobileSidebarOpen(false)}
					className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 lg:hidden"
				>
					<CloseIcon />
				</button>

				<div className="flex h-full flex-col">
					<div
						className={cn('border-b border-gray-200 py-4', isSidebarExpanded ? 'px-6' : 'px-3 text-center')}
					>
						<div className="flex items-center gap-2">
							<img src={logo} alt={strings.appName} className="h-12" />
							<h1 className="text-2xl font-bold text-blue-600">{isSidebarExpanded && strings.appName}</h1>
						</div>
						{isSidebarExpanded && (
							<p className="mt-1 justify-self-center text-xs text-gray-600">{strings.appSubtitle}</p>
						)}
					</div>

					<SidebarNavigation
						navigation={navigation}
						isSidebarExpanded={isSidebarExpanded}
						currentPath={location.pathname}
						onNavigate={() => setIsMobileSidebarOpen(false)}
					/>

					<div className={cn('border-t border-gray-200 px-4 py-4', !isSidebarExpanded && 'text-center')}>
						<button
							onClick={() =>
								location.pathname === consts.profileRoute ? navigate(-1) : navigate(consts.profileRoute)
							}
							className={cn(
								'block w-full rounded-lg text-left hover:bg-gray-50',
								isSidebarExpanded && '-mx-2 p-2',
							)}
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
			<div className="relative flex-1 overflow-auto pt-14 lg:pt-0">
				<button
					type="button"
					aria-label={strings.openSidebar}
					onClick={() => setIsMobileSidebarOpen(true)}
					className="fixed left-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 lg:hidden"
				>
					<MenuIcon />
				</button>

				{shouldShowEmergencyHeader && (
					<div className="sticky top-0 z-10 border-b border-red-200 bg-red-50 px-4 py-3 lg:px-6">
						<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm font-semibold text-red-700">{strings.emergencyHeaderTitle}</p>
							<button
								type="button"
								onClick={() => navigate(consts.emergencyReportRoute)}
								className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
							>
								{strings.emergencyHeaderAction}
							</button>
						</div>
					</div>
				)}

				<Outlet />
			</div>
		</div>
	);
}
