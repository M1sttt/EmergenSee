export const CONSTS = {
	TABS: {
		ADD: 'add' as const,
		REMOVE: 'remove' as const,
	},
	QUERY_KEYS: {
		USERS: ['users'],
	},
	CLASSES: {
		OVERLAY: 'fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity',
		MODAL_CONTAINER: 'fixed inset-0 z-50 overflow-y-auto',
		MODAL_WRAPPER: 'flex min-h-screen items-center justify-center p-4 text-center sm:p-0',
		MODAL_CONTENT:
			'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl flex flex-col max-h-[80vh]',
		HEADER: 'bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 flex-none border-b border-gray-200',
		TITLE: 'text-lg font-semibold leading-6 text-gray-900 mb-2',
		TAB_CONTAINER: 'flex border-b border-gray-200 mb-4',
		TAB_BASE: 'py-2 px-4 font-medium text-sm border-b-2',
		TAB_ACTIVE: 'border-blue-500 text-blue-600',
		TAB_INACTIVE: 'border-transparent text-gray-500 hover:text-gray-700',
		SEARCH_INPUT:
			'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm',
		LIST_CONTAINER: 'flex-1 overflow-y-auto p-4 bg-gray-50',
		LIST_ITEM_BASE:
			'flex items-center justify-between p-3 rounded-md cursor-pointer border transition-colors',
		LIST_ITEM_SELECTED: 'bg-blue-50 border-blue-200',
		LIST_ITEM_UNSELECTED: 'bg-white border-gray-200 hover:bg-gray-50',
		USER_NAME: 'text-sm font-medium text-gray-900',
		USER_EMAIL: 'text-xs text-gray-500',
		CHECKBOX_BASE: 'w-5 h-5 rounded-sm flex items-center justify-center border',
		CHECKBOX_SELECTED: 'bg-blue-600 border-blue-600 text-white',
		CHECKBOX_UNSELECTED: 'border-gray-300',
		FOOTER: 'bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 flex-none border-t border-gray-200',
		BTN_PRIMARY:
			'inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto disabled:opacity-50',
		BTN_ADD: 'bg-blue-600 hover:bg-blue-500',
		BTN_REMOVE: 'bg-red-600 hover:bg-red-500',
		BTN_CLOSE:
			'mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto',
	},
};
