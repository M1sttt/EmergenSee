export const ROUTES = {
	DASHBOARD: '/dashboard',
	LOGIN: '/login',
};

export const PARAMS = {
	ACCESS_TOKEN: 'accessToken',
	REFRESH_TOKEN: 'refreshToken',
};

export const API_ENDPOINTS = {
	MEOAUTH: '/auth/me',
};

export const CLASSES = {
	MAIN_CONTAINER: 'min-h-screen flex items-center justify-center bg-gray-100',
	ERROR_CARD: 'max-w-sm w-full bg-white rounded-lg shadow-lg p-8 text-center flex flex-col items-center',
	ERROR_TEXT: 'text-red-600 mb-4 text-center mt-2',
	BACK_LINK: 'text-blue-600 hover:underline text-sm flex items-center gap-1',
	LOADING_WRAPPER: 'text-center',
	LOADING_SPINNER: 'animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4',
	LOADING_TEXT: 'text-gray-600 text-sm',
	ERROR_ICON: 'text-red-600 text-4xl',
};
