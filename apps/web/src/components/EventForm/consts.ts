export const defaultLocationType = 'Point' as const;
export const defaultLocationCoordinates = [-74.006, 40.7128] as [number, number];

export const departmentsQueryKey = ['departments'] as const;
export const eventsQueryKey = ['events'] as const;

export const containerClass = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
export const formCardClass = 'bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto';
export const titleClass = 'text-2xl font-bold text-gray-900 mb-6 flex flex-row items-center gap-2';
export const labelClass = 'block text-sm font-medium text-gray-700 mt-4 mb-1';
export const inputClass =
    'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 focus:bg-white';
export const textareaClass =
    'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 focus:bg-white';
export const selectClass =
    'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 focus:bg-white';
export const multiSelectClass =
    'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-24 text-gray-900 bg-white focus:bg-white';
export const errorClass = 'mt-1 text-sm text-red-600';
export const buttonGroupClass = 'flex justify-end space-x-3 mt-8';
export const btnCancelClass =
    'px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors';
export const btnSubmitClass =
    'px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors';
export const btnLoadingClass = 'opacity-50 cursor-not-allowed';
export const loadingContainerClass = 'flex flex-col items-center justify-center p-12 text-gray-500';
export const errorContainerClass = 'p-4 bg-red-50 text-red-600 rounded-md text-center';
