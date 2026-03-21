import { ButtonHTMLAttributes, ReactNode, useId } from 'react';
import { Tooltip } from 'react-tooltip';
import { cn } from '@/utils/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	tooltipText?: string;
	disabled?: boolean;
}

export function IconButton({
	children,
	tooltipText,
	className,
	onClick,
	disabled = false,
	...props
}: IconButtonProps) {
	const tooltipId = useId();

	const handleClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick'] = event => {
		event.stopPropagation();
		if (disabled) return;
		onClick?.(event);
	};

	return (
		<>
			<button
				{...props}
				type={props.type || 'button'}
				onClick={handleClick}
				disabled={disabled}
				data-tooltip-id={tooltipText && !disabled ? tooltipId : undefined}
				data-tooltip-content={tooltipText}
				className={cn(
					'ui-icon-btn disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
					className,
				)}
				style={{ width: 22, height: 22 }}
			>
				{children}
			</button>
			{tooltipText && !disabled && <Tooltip id={tooltipId} style={{ fontSize: '12px', padding: '4px 8px' }} />}
		</>
	);
}
