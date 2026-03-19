import { forwardRef, memo } from 'react';
import ReactSelect, { Props as SelectProps } from 'react-select';

export interface SelectOption {
	value: string;
	label: string;
}

export interface SelectDropdownProps extends Omit<
	SelectProps<SelectOption, boolean>,
	'onChange' | 'value' | 'options' | 'isMulti'
> {
	options: SelectOption[];
	value?: string | string[];
	onChange?: (value: any) => void;
	label?: string;
	error?: string;
	isMulti?: boolean;
}

const SelectDropdown = forwardRef<any, SelectDropdownProps>(
	({ options, value, onChange, label, error, isMulti = false, ...props }, ref) => {
		const selectedOption = isMulti
			? options.filter(opt => (value as string[])?.includes?.(opt.value))
			: options.find(opt => opt.value === value) || null;

		const handleChange = (newValue: any) => {
			if (!onChange) return;
			if (isMulti) {
				onChange((newValue as SelectOption[])?.map(v => v.value) || []);
			} else {
				onChange((newValue as SelectOption)?.value || '');
			}
		};

		return (
			<div className="flex flex-col gap-1 w-full relative">
				{label && <label className="text-sm font-medium text-gray-700">{label}</label>}
				<ReactSelect
					ref={ref}
					value={selectedOption}
					onChange={handleChange}
					options={options}
					isMulti={isMulti}
					classNamePrefix="react-select"
					styles={{
						control: (base, state) => ({
							...base,
							borderColor: error ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
							boxShadow: state.isFocused ? (error ? '0 0 0 1px #ef4444' : '0 0 0 1px #3b82f6') : 'none',
							'&:hover': {
								borderColor: error ? '#ef4444' : '#3b82f6',
							},
							padding: '2px',
							borderRadius: '0.375rem',
						}),
					}}
					{...props}
				/>
				{error && <span className="text-xs text-red-500 mt-1">{error}</span>}
			</div>
		);
	},
);

SelectDropdown.displayName = 'SelectDropdown';

export default memo(SelectDropdown);
