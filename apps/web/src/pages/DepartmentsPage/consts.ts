export const CONSTANTS = {
	QUERY_KEYS: {
		DEPARTMENTS: 'departments',
		USERS: 'users',
	},
} as const;

export const CLASSES = {
	PAGE_CONTAINER: 'p-6',
	HEADER_WRAPPER: 'flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4',
	PAGE_TITLE: 'text-3xl font-bold text-gray-900',
	SEARCH_CONTAINER: 'flex gap-4 w-full sm:w-auto',
	SEARCH_INPUT:
		'flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
	CREATE_BUTTON:
		'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap',
	TABLE_CONTAINER: 'bg-white rounded-lg shadow overflow-hidden',
	TABLE: 'min-w-full divide-y divide-gray-200',
	THEAD: 'bg-gray-50',
	TH: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
	TH_LAST: 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
	TBODY: 'bg-white divide-y divide-gray-200',
	TD: 'px-6 py-4 whitespace-nowrap',
	TD_TEXT: 'text-sm font-medium text-gray-900 truncate max-w-[150px]',
	TD_DESC: 'text-sm text-gray-500 truncate max-w-[200px]',
	TD_ADMINS: 'text-sm text-gray-500 truncate max-w-[250px]',
	TD_ACTIONS: 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium',
	ACTION_BTN_INFO: 'mr-4',
	ACTION_BTN_EDIT: 'mr-4',
	ACTION_BTN_DEL: 'text-red-600 hover:text-red-900',
	EMPTY_ROW: 'px-6 py-4 text-center text-sm text-gray-500',
	ERROR_TEXT: 'text-red-500 text-center py-4',
} as const;
