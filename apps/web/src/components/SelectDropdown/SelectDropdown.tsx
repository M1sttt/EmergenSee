import { forwardRef, memo, useMemo } from 'react';
import ReactSelect, {
	GroupBase,
	Props as SelectProps,
	SelectInstance,
	StylesConfig,
} from 'react-select';

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

const SelectDropdown = forwardRef<
	SelectInstance<SelectOption, boolean, GroupBase<SelectOption>>,
	SelectDropdownProps
>(
	(
		{ options, value, onChange, label, error, isMulti = false, containerClassName = 'w-full', ...props },
		ref,
	) => {
		const selectedOption = useMemo(() => {
			if (isMulti) {
				const selectedValues = Array.isArray(value) ? value : [];
				return options.filter(option => selectedValues.includes(option.value));
			}

			return options.find(option => option.value === value) || null;
		}, [isMulti, options, value]);

		const handleChange: SelectProps<SelectOption, boolean, GroupBase<SelectOption>>['onChange'] = newValue => {
			if (!onChange) return;

			if (isMulti) {
				const selectedValues = Array.isArray(newValue)
					? (newValue as SelectOption[]).map(option => option.value)
					: [];
				onChange(selectedValues);
				return;
			}

			onChange((newValue as SelectOption | null)?.value || '');
		};

		const selectStyles: StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> = useMemo(
			() => ({
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
			}),
			[error],
		);

		const menuPortalTarget = typeof window === 'undefined' ? undefined : document.body;

		return (
			<div className={`flex flex-col gap-1 relative ${containerClassName}`.trim()}>
				{label && <label className="text-sm font-medium text-gray-700">{label}</label>}
				<ReactSelect
					{...props}
					ref={ref}
					value={selectedOption}
					onChange={handleChange}
					options={options}
					isMulti={isMulti}
					classNamePrefix={props.classNamePrefix || 'react-select'}
					styles={selectStyles}
					menuPosition={props.menuPosition || 'fixed'}
					menuPortalTarget={props.menuPortalTarget || menuPortalTarget}
				/>
				{error && <span className="text-xs text-red-500 mt-1">{error}</span>}
			</div>
		);
	},
);

SelectDropdown.displayName = 'SelectDropdown';

export default memo(SelectDropdown);
