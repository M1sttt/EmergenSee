import { ResponderStatus } from '@emergensee/shared';

export const allDeptsValue = 'all';
export const dateFormat = 'MMM d, HH:mm';

export const containerClass = 'p-6';
export const headerContainerClass = 'flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4';
export const titleClass = 'text-3xl font-bold text-gray-900';
export const selectContainerClass = 'flex flex-col md:flex-row gap-4';
export const labelContainerClass = 'flex items-center gap-2';
export const labelClass = 'text-sm font-medium text-gray-700';
export const selectClass =
    'border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 bg-white';
export const tableContainerClass = 'bg-white rounded-lg shadow overflow-hidden';
export const tableClass = 'min-w-full divide-y divide-gray-200';
export const theadClass = 'bg-gray-50';
export const thClass = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
export const thRightClass = 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider';
export const tbodyClass = 'bg-white divide-y divide-gray-200';
export const tdClass = 'px-6 py-4 whitespace-nowrap';
export const textMainClass = 'text-sm font-medium text-gray-900';
export const textSubClass = 'text-sm text-gray-500';
export const statusBadgeBaseClass = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full gap-1 items-center';
export const buttonContainerClass = 'flex justify-end gap-2';
export const btnSafeClass =
    'bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1';
export const btnHelpClass =
    'bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1';
export const emptyStateClass = 'bg-white rounded-lg shadow p-6 text-center text-gray-500';
export const errorStateClass = 'bg-red-50 rounded-lg p-6 text-center text-red-500';

export const safeStatusStyle = 'bg-green-100 text-green-800';
export const needHelpStatusStyle = 'bg-red-100 text-red-800';
export const unknownStatusStyle = 'bg-gray-100 text-gray-800';
export const awayStatusStyle = 'bg-blue-100 text-blue-800';

export const getStatusStyle = (status: ResponderStatus): string => {
    switch (status) {
        case ResponderStatus.SAFE:
            return safeStatusStyle;
        case ResponderStatus.NEED_HELP:
            return needHelpStatusStyle;
        case ResponderStatus.AWAY:
            return awayStatusStyle;
        case ResponderStatus.UNKNOWN:
        default:
            return unknownStatusStyle;
    }
};
