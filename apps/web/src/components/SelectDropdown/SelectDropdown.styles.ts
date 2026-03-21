import { GroupBase, StylesConfig } from 'react-select';
import { SelectOption } from './SelectDropdown.types';

export const buildSelectDropdownStyles = (
	error?: string,
	menuHeight?: number,
): StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> => ({
	control: (base, state) => ({
		...base,
		borderColor: error ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
		boxShadow: state.isFocused
			? error
				? '0 0 0 1px #ef4444'
				: '0 0 0 1px #3b82f6'
			: 'none',
		'&:hover': {
			borderColor: error ? '#ef4444' : '#3b82f6',
		},
		padding: '2px',
		borderRadius: '0.375rem',
	}),
	menuPortal: base => ({
		...base,
		zIndex: 60,
	}),
	menuList: base => ({
		...base,
		...(menuHeight ? { maxHeight: menuHeight } : {}),
		paddingTop: 0,
	}),
});