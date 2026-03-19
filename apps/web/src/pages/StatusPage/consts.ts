import { ResponderStatus } from '@emergensee/shared';

export const STATUS_PAGE_CONSTS = {
	ALL_DEPTS_VALUE: 'all',
	DATE_FORMAT: 'MMM d, HH:mm',
};

export const COMMON_CLASSES = {
	CONTAINER: 'p-6',
	HEADER_CONTAINER: 'flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4',
	TITLE: 'text-3xl font-bold text-gray-900',
	SELECT_CONTAINER: 'flex flex-col md:flex-row gap-4',
	LABEL_CONTAINER: 'flex items-center gap-2',
	LABEL: 'text-sm font-medium text-gray-700',
	SELECT:
		'border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 bg-white',
	TABLE_CONTAINER: 'bg-white rounded-lg shadow overflow-hidden',
	TABLE: 'min-w-full divide-y divide-gray-200',
	THEAD: 'bg-gray-50',
	TH: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
	TH_RIGHT: 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
	TBODY: 'bg-white divide-y divide-gray-200',
	TD: 'px-6 py-4 whitespace-nowrap',
	TEXT_MAIN: 'text-sm font-medium text-gray-900',
	TEXT_SUB: 'text-sm text-gray-500',
	STATUS_BADGE_BASE: 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full gap-1 items-center',
	BUTTON_CONTAINER: 'flex justify-end gap-2',
	BTN_SAFE:
		'bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1',
	BTN_HELP:
		'bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1',
	EMPTY_STATE: 'bg-white rounded-lg shadow p-6 text-center text-gray-500',
	ERROR_STATE: 'bg-red-50 rounded-lg p-6 text-center text-red-500',
};

export const STATUS_STYLE_MAP: Record<ResponderStatus, string> = {
	[ResponderStatus.SAFE]: 'bg-green-100 text-green-800',
	[ResponderStatus.NEED_HELP]: 'bg-red-100 text-red-800',
	[ResponderStatus.UNKNOWN]: 'bg-gray-100 text-gray-800',
	[ResponderStatus.AWAY]: 'bg-blue-100 text-blue-800',
};
