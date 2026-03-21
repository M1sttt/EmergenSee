import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface SelectDropdownFieldProps {
	label?: string;
	error?: string;
	containerClassName?: string;
	children: ReactNode;
}

export function SelectDropdownField({
	label,
	error,
	containerClassName,
	children,
}: SelectDropdownFieldProps) {
	return (
		<div className={cn('relative flex flex-col gap-1', containerClassName)}>
			{label && <label className="text-sm font-medium text-gray-700">{label}</label>}
			{children}
			{error && <span className="mt-1 text-xs text-red-500">{error}</span>}
		</div>
	);
}