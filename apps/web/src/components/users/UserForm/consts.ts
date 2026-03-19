export const CONSTANTS = {
	CLASSES: {
		OVERLAY: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
		MODAL: 'bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto',
		TITLE: 'text-2xl font-bold text-gray-900 mb-6',
		LABEL: 'block text-sm font-medium text-gray-700',
		INPUT:
			'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500',
		SELECT_DEPTS:
			'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-24',
		ERROR_TEXT: 'mt-1 text-sm text-red-600',
		CANCEL_BTN:
			'px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2',
		SUBMIT_BTN:
			'px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2',
		ACTIONS_WRAPPER: 'flex justify-end space-x-3 mt-6',
		GRID_2_COLS: 'grid grid-cols-2 gap-4',
		GRID_1_COL: 'grid grid-cols-1 gap-4',
		SPACE_Y_4: 'space-y-4',
	},
	QUERY_KEYS: {
		DEPARTMENTS: ['departments'],
		USERS: ['users'],
	},
};
