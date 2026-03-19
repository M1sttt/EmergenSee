import {
    FaChartBar,
    FaExclamationCircle,
    FaMap,
    FaUsers,
    FaBuilding,
    FaChevronLeft,
    FaChevronRight,
    FaSignOutAlt,
    FaHeartbeat
} from 'react-icons/fa';
import { AiFillAlert } from 'react-icons/ai';

export const dashboardRoute = '/dashboard';
export const eventsRoute = '/events';
export const mapRoute = '/map';
export const usersRoute = '/users';
export const departmentsRoute = '/departments';
export const statusRoute = '/status';
export const emergencyReportRoute = '/emergency-report';
export const profileRoute = '/profile';

export const eventsQueryKey = ['events'] as const;
export const statusQueryKey = ['status'] as const;

export const dashboardIcon = FaChartBar;
export const eventsIcon = FaExclamationCircle;
export const mapIcon = FaMap;
export const usersIcon = FaUsers;
export const departmentsIcon = FaBuilding;
export const statusIcon = FaHeartbeat;
export const emergencyIcon = AiFillAlert;
export const collapseIcon = FaChevronLeft;
export const expandIcon = FaChevronRight;
export const logoutIcon = FaSignOutAlt;

export const sidebarBase = 'relative bg-white shadow-lg transition-all duration-200';
export const sidebarExpanded = 'w-64';
export const sidebarCollapsed = 'w-20';
export const sidebarBtn =
    'absolute -right-3 top-8 z-10 h-6 w-6 rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 flex items-center justify-center text-xs';
export const layoutContainer = 'flex h-screen bg-gray-100';
export const sidebarWrapper = 'flex flex-col h-full';
export const logoContainerBase = 'py-4 border-b border-gray-200';
export const logoContainerExpanded = 'px-6';
export const logoContainerCollapsed = 'px-3 text-center';
export const logoTextExpanded = 'text-2xl font-bold text-blue-600';
export const logoTextCollapsed = 'text-2xl font-bold text-blue-600';
export const subtitle = 'text-xs text-gray-600 mt-1 justify-self-center';
export const navContainerBase = 'flex-1 py-4 space-y-1';
export const navContainerExpanded = 'px-4';
export const navContainerCollapsed = 'px-2';
export const navLinkBase = 'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors';
export const navLinkCollapsedExtra = 'justify-center px-2';
export const emergencyMsgActive = 'bg-red-600 text-white';
export const emergencyMsgInactive = 'bg-red-500 text-white hover:bg-red-600 shadow-md';
export const emergencyPulse = 'animate-pulse';
export const normalMsgActive = 'bg-blue-50 text-blue-700';
export const normalMsgInactive = 'text-gray-700 hover:bg-gray-50';
export const userInfoContainerBase = 'px-4 py-4 border-t border-gray-200';
export const userInfoContainerCollapsed = 'text-center';
export const userBtnBase = 'block w-full text-left hover:bg-gray-50 rounded-lg';
export const userBtnExpandedExtra = 'p-2 -mx-2';
export const userFlex = 'flex items-center';
export const userDetails = 'flex-1';
export const userNameText = 'text-sm font-medium text-gray-900';
export const userEmailText = 'text-xs text-gray-600 truncate';
export const userAvatar =
    'mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100';
export const logoutBtnBase =
    'mt-3 flex items-center justify-center w-full text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors';
export const logoutBtnExpanded = 'px-4 py-2 gap-2';
export const logoutBtnCollapsed = 'px-2 py-2';
export const mainContent = 'flex-1 overflow-auto';
