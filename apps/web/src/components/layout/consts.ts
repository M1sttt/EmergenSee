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
