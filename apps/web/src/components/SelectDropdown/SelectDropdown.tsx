import { forwardRef, memo, useMemo } from 'react';
import ReactSelect, { GroupBase, Props as SelectProps, SelectInstance } from 'react-select';
import { maxOptionsMenuHeight } from './SelectDropdown.constants';
import { SelectDropdownField } from './SelectDropdownField';
import { buildSelectDropdownStyles } from './SelectDropdown.styles';
import { SelectDropdownProps, SelectOption } from './SelectDropdown.types';
import { getSelectedOption, mapOnChangeValue } from './SelectDropdown.utils';

const SelectDropdown = forwardRef<
	SelectInstance<SelectOption, boolean, GroupBase<SelectOption>>,
	SelectDropdownProps
>(
	(
		{
			options,
			value,
			onChange,
			label,
			error,
			isMulti = false,
			isSearchable = true,
			containerClassName = 'w-full',
			closeMenuOnSelect,
			maxMenuHeight,
			menuPosition,
			menuPortalTarget,
			classNamePrefix,
			...props
		},
		ref,
	) => {
		const selectedOption = useMemo(
			() => getSelectedOption(isMulti, options, value),
			[isMulti, options, value],
		);

		const resolvedMaxMenuHeight = maxMenuHeight || maxOptionsMenuHeight;
		const selectStyles = useMemo(
			() => buildSelectDropdownStyles(error, resolvedMaxMenuHeight),
			[error, resolvedMaxMenuHeight],
		);

		const defaultMenuPortalTarget = typeof window === 'undefined' ? undefined : document.body;

		const handleChange: SelectProps<SelectOption, boolean, GroupBase<SelectOption>>['onChange'] = newValue => {
			if (!onChange) return;
			onChange(mapOnChangeValue(isMulti, newValue));
		};

		return (
			<SelectDropdownField label={label} error={error} containerClassName={containerClassName}>
				<ReactSelect
					{...props}
					ref={ref}
					value={selectedOption}
					onChange={handleChange}
					options={options}
					isMulti={isMulti}
					isSearchable={isSearchable}
					openMenuOnClick
					openMenuOnFocus
					blurInputOnSelect={false}
					closeMenuOnSelect={isMulti ? false : closeMenuOnSelect}
					classNamePrefix={classNamePrefix || 'react-select'}
					styles={selectStyles}
					menuPosition={menuPosition || 'fixed'}
					menuPortalTarget={menuPortalTarget || defaultMenuPortalTarget}
					maxMenuHeight={resolvedMaxMenuHeight}
				/>
			</SelectDropdownField>
		);
	},
);

SelectDropdown.displayName = 'SelectDropdown';

export default memo(SelectDropdown);
