export const addTab = 'add' as const;
export const removeTab = 'remove' as const;

export const usersQueryKey = ['users'] as const;

export const overlayClass = 'fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity';
export const modalContainerClass = 'fixed inset-0 z-50 overflow-y-auto';
export const modalWrapperClass = 'flex min-h-screen items-center justify-center p-4 text-center sm:p-0';
export const modalContentClass =
	'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl flex flex-col max-h-[80vh]';
export const headerClass = 'bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 flex-none border-b border-gray-200';
export const titleClass = 'text-lg font-semibold leading-6 text-gray-900 mb-2';
export const tabContainerClass = 'flex border-b border-gray-200 mb-4';
export const tabBaseClass = 'py-2 px-4 font-medium text-sm border-b-2';
export const tabActiveClass = 'border-blue-500 text-blue-600';
export const tabInactiveClass = 'border-transparent text-gray-500 hover:text-gray-700';
export const searchInputClass =
	'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm';
export const listContainerClass = 'flex-1 overflow-y-auto p-4 bg-gray-50';
export const listItemBaseClass = 'flex items-center justify-between p-3 rounded-md cursor-pointer border transition-colors';
export const listItemSelectedClass = 'bg-blue-50 border-blue-200';
export const listItemUnselectedClass = 'bg-white border-gray-200 hover:bg-gray-50';
export const userNameClass = 'text-sm font-medium text-gray-900';
export const userEmailClass = 'text-xs text-gray-500';
export const checkboxBaseClass = 'w-5 h-5 rounded-sm flex items-center justify-center border';
export const checkboxSelectedClass = 'bg-blue-600 border-blue-600 text-white';
export const checkboxUnselectedClass = 'border-gray-300';
export const footerClass = 'bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 flex-none border-t border-gray-200';
export const btnPrimaryClass =
	'inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto disabled:opacity-50';
export const btnAddClass = 'bg-blue-600 hover:bg-blue-500';
export const btnRemoveClass = 'bg-red-600 hover:bg-red-500';
export const btnCloseClass =
	'mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto';
