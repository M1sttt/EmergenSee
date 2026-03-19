import {
	ChangeEvent,
	FocusEvent as ReactFocusEvent,
	MouseEvent as ReactMouseEvent,
	TouchEvent as ReactTouchEvent,
	forwardRef,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
} from 'react';
import ReactSelect, {
	components as selectComponents,
	GroupBase,
	MenuListProps,
	Props as SelectProps,
	SelectInstance,
	StylesConfig,
} from 'react-select';
import { cn } from '@/utils/cn';

export interface SelectOption {
	value: string;
	label: string;
}

const defaultMenuSearchPlaceholder = 'Search...';
const maxOptionsMenuHeight = 200;

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
	menuSearchPlaceholder?: string;
}

interface MenuSearchSelectProps {
	menuSearchValue: string;
	menuSearchPlaceholder: string;
	onMenuSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
	onMenuSearchMouseDown: (event: ReactMouseEvent<HTMLDivElement | HTMLInputElement>) => void;
	onMenuSearchTouchStart: (event: ReactTouchEvent<HTMLDivElement | HTMLInputElement>) => void;
}

const SelectDropdownMenuList = (
	menuListProps: MenuListProps<SelectOption, boolean, GroupBase<SelectOption>>,
) => {
	const {
		menuSearchValue,
		menuSearchPlaceholder,
		onMenuSearchChange,
		onMenuSearchMouseDown,
		onMenuSearchTouchStart,
	} = menuListProps.selectProps as unknown as MenuSearchSelectProps;

	return (
		<selectComponents.MenuList {...menuListProps}>
			<div
				className="sticky top-0 z-10 border-b border-gray-100 bg-white px-2 py-2"
				onMouseDown={onMenuSearchMouseDown}
				onTouchStart={onMenuSearchTouchStart}
			>
				<input
					type="text"
					value={menuSearchValue}
					onChange={onMenuSearchChange}
					onMouseDown={onMenuSearchMouseDown}
					onTouchStart={onMenuSearchTouchStart}
					onKeyDown={event => event.stopPropagation()}
					className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
					placeholder={menuSearchPlaceholder}
				/>
			</div>
			{menuListProps.children}
		</selectComponents.MenuList>
	);
};

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
			containerClassName = 'w-full',
			components: customComponents,
			onMenuOpen,
			onMenuClose,
			onFocus,
			onBlur,
			menuIsOpen: controlledMenuIsOpen,
			maxMenuHeight,
			menuSearchPlaceholder = defaultMenuSearchPlaceholder,
			...props
		},
		ref,
	) => {
		const [menuSearchValue, setMenuSearchValue] = useState('');
		const [internalMenuIsOpen, setInternalMenuIsOpen] = useState(false);
		const menuSearchInteractingRef = useRef(false);

		const isMenuOpenControlled = controlledMenuIsOpen !== undefined;
		const menuIsOpen = isMenuOpenControlled ? controlledMenuIsOpen : internalMenuIsOpen;

		const normalizedSearchValue = menuSearchValue.trim().toLowerCase();

		const selectedOption = useMemo(() => {
			if (isMulti) {
				const selectedValues = Array.isArray(value) ? value : [];
				return options.filter(option => selectedValues.includes(option.value));
			}

			return options.find(option => option.value === value) || null;
		}, [isMulti, options, value]);

		const filteredOptions = useMemo(() => {
			if (!normalizedSearchValue) {
				return options;
			}

			return options.filter(option => {
				const normalizedLabel = option.label.toLowerCase();
				const normalizedValue = option.value.toLowerCase();
				return (
					normalizedLabel.includes(normalizedSearchValue) ||
					normalizedValue.includes(normalizedSearchValue)
				);
			});
		}, [normalizedSearchValue, options]);

		const handleMenuSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
			setMenuSearchValue(event.target.value);
		}, []);

		const markMenuSearchInteraction = useCallback(() => {
			menuSearchInteractingRef.current = true;
			window.setTimeout(() => {
				menuSearchInteractingRef.current = false;
			}, 0);
		}, []);

		const handleMenuSearchMouseDown = useCallback(
			(event: ReactMouseEvent<HTMLDivElement | HTMLInputElement>) => {
				event.stopPropagation();
				markMenuSearchInteraction();
			},
			[markMenuSearchInteraction],
		);

		const handleMenuSearchTouchStart = useCallback(
			(event: ReactTouchEvent<HTMLDivElement | HTMLInputElement>) => {
				event.stopPropagation();
				markMenuSearchInteraction();
			},
			[markMenuSearchInteraction],
		);

		const handleMenuOpen = useCallback(() => {
			if (!isMenuOpenControlled) {
				setInternalMenuIsOpen(true);
			}
			onMenuOpen?.();
		}, [isMenuOpenControlled, onMenuOpen]);

		const handleMenuClose = useCallback(() => {
			if (menuSearchInteractingRef.current) {
				if (!isMenuOpenControlled) {
					setInternalMenuIsOpen(true);
				}
				return;
			}

			setMenuSearchValue('');
			if (!isMenuOpenControlled) {
				setInternalMenuIsOpen(false);
			}
			onMenuClose?.();
		}, [isMenuOpenControlled, onMenuClose]);

		const handleFocus = useCallback(
			(event: ReactFocusEvent<HTMLElement>) => {
				if (!isMenuOpenControlled) {
					setInternalMenuIsOpen(true);
				}
				onFocus?.(event as ReactFocusEvent<HTMLInputElement>);
			},
			[isMenuOpenControlled, onFocus],
		);

		const handleBlur = useCallback(
			(event: ReactFocusEvent<HTMLElement>) => {
				if (menuSearchInteractingRef.current) {
					return;
				}

				if (!isMenuOpenControlled) {
					setInternalMenuIsOpen(false);
				}
				onBlur?.(event as ReactFocusEvent<HTMLInputElement>);
			},
			[isMenuOpenControlled, onBlur],
		);

		const mergedComponents = useMemo(
			() => ({
				...customComponents,
				MenuList: SelectDropdownMenuList,
			}),
			[customComponents],
		);

		const menuSearchProps = useMemo(
			() => ({
				menuSearchValue,
				menuSearchPlaceholder,
				onMenuSearchChange: handleMenuSearchChange,
				onMenuSearchMouseDown: handleMenuSearchMouseDown,
				onMenuSearchTouchStart: handleMenuSearchTouchStart,
			}),
			[
				handleMenuSearchChange,
				handleMenuSearchMouseDown,
				handleMenuSearchTouchStart,
				menuSearchPlaceholder,
				menuSearchValue,
			],
		);

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
				menuList: base => ({
					...base,
					maxHeight: maxOptionsMenuHeight,
					paddingTop: 0,
				}),
			}),
			[error],
		);

		const menuPortalTarget = typeof window === 'undefined' ? undefined : document.body;

		return (
			<div className={cn('flex flex-col gap-1 relative', containerClassName)}>
				{label && <label className="text-sm font-medium text-gray-700">{label}</label>}
				<ReactSelect
					{...props}
					{...(menuSearchProps as unknown as Record<string, unknown>)}
					ref={ref}
					value={selectedOption}
					onChange={handleChange}
					options={filteredOptions}
					isMulti={isMulti}
					components={mergedComponents}
					onFocus={handleFocus}
					onBlur={handleBlur}
					menuIsOpen={menuIsOpen}
					classNamePrefix={props.classNamePrefix || 'react-select'}
					styles={selectStyles}
					menuPosition={props.menuPosition || 'fixed'}
					menuPortalTarget={props.menuPortalTarget || menuPortalTarget}
					onMenuOpen={handleMenuOpen}
					onMenuClose={handleMenuClose}
					maxMenuHeight={maxMenuHeight || maxOptionsMenuHeight}
				/>
				{error && <span className="text-xs text-red-500 mt-1">{error}</span>}
			</div>
		);
	},
);

SelectDropdown.displayName = 'SelectDropdown';

export default memo(SelectDropdown);
