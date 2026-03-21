import { GroupBase, OnChangeValue, Props as SelectProps } from 'react-select';
import { SelectOption } from './types';

export const getSelectedOption = (
	isMulti: boolean,
	options: SelectOption[],
	value?: string | string[],
): SelectProps<SelectOption, boolean, GroupBase<SelectOption>>['value'] => {
	if (isMulti) {
		const selectedValues = Array.isArray(value) ? value : [];
		return options.filter(option => selectedValues.includes(option.value));
	}

	return options.find(option => option.value === value) || null;
};

export const mapOnChangeValue = (
	isMulti: boolean,
	newValue: OnChangeValue<SelectOption, boolean>,
): string | string[] => {
	if (isMulti) {
		return Array.isArray(newValue) ? newValue.map(option => option.value) : [];
	}

	return (newValue as SelectOption | null)?.value || '';
};