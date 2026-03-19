export const CONSTS = {
	CLASSES: {
		LOADING_WRAPPER: 'p-6',
		NO_EVENT_WRAPPER: 'p-6 text-center',
		NO_EVENT_TITLE: 'text-2xl font-bold text-gray-800',
		NO_EVENT_DESC: 'text-gray-600 mt-2',
		MAIN_WRAPPER: 'min-h-screen bg-red-50 p-6 flex flex-col items-center justify-center',
		CONTENT_BOX: 'bg-white rounded-lg shadow-xl p-8 max-w-lg w-full text-center border-t-4 border-red-600',
		TITLE: 'text-4xl font-bold text-red-600 mb-2 flex items-center justify-center gap-2',
		DESCRIPTION: 'text-gray-700 mb-6 text-lg',
		SUCCESS_MESSAGE: 'mb-6 p-4 rounded-md bg-blue-50 text-blue-800 font-medium',
		BUTTONS_WRAPPER: 'space-y-6',
		SAFE_BUTTON:
			'w-full py-6 bg-green-500 hover:bg-green-600 text-white font-bold text-2xl rounded-xl shadow-lg transform transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2',
		HELP_BUTTON:
			'w-full py-6 bg-red-600 hover:bg-red-700 text-white font-bold text-2xl rounded-xl shadow-lg transform transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2',
	},
	TIMEOUTS: {
		SUCCESS_MESSAGE: 5000,
	},
} as const;
