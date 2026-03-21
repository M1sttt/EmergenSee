import { GroupBase, Props as SelectProps } from 'react-select';

export interface SelectOption {
	value: string;
	label: string;
}

export interface SelectDropdownProps
	extends Omit<
		SelectProps<SelectOption, boolean, GroupBase<SelectOption>>,
		'onChange' | 'value' | 'options' | 'isMulti'
	> {
	options: SelectOption[];
	value?: string | string[];
	onChange?: (value: string | string[]) => void;
	label?: string;
	error?: string;
	isMulti?: boolean;
	containerClassName?: string;
}