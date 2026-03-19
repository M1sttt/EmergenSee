export const EventFormConsts = {
	DEFAULT_LOCATION: {
		type: 'Point' as const,
		coordinates: [-74.006, 40.7128],
	},
	QUERY_KEYS: {
		DEPARTMENTS: ['departments'],
		EVENTS: ['events'],
	},
	STYLES: {
		CONTAINER: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
		FORM_CARD: 'bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto',
		TITLE: 'text-2xl font-bold text-gray-900 mb-6 flex flex-row items-center gap-2',
		LABEL: 'block text-sm font-medium text-gray-700 mt-4 mb-1',
		INPUT:
			'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 focus:bg-white',
		TEXTAREA:
			'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 focus:bg-white',
		SELECT:
			'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 focus:bg-white',
		MULTI_SELECT:
			'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-24 text-gray-900 bg-white focus:bg-white',
		ERROR: 'mt-1 text-sm text-red-600',
		BUTTON_GROUP: 'flex justify-end space-x-3 mt-8',
		BTN_CANCEL:
			'px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors',
		BTN_SUBMIT:
			'px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors',
		BTN_LOADING: 'opacity-50 cursor-not-allowed',
		LOADING_CONTAINER: 'flex flex-col items-center justify-center p-12 text-gray-500',
		ERROR_CONTAINER: 'p-4 bg-red-50 text-red-600 rounded-md text-center',
	},
};
