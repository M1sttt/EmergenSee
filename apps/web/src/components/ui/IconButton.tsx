import { ButtonHTMLAttributes, ReactNode, useId } from 'react';
import { Tooltip } from 'react-tooltip';
import { cn } from '@/utils/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	tooltipText?: string;
}

export function IconButton({ children, tooltipText, className, onClick, ...props }: IconButtonProps) {
	const tooltipId = useId();

	const handleClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick'] = event => {
		event.stopPropagation();
		onClick?.(event);
	};

	return (
		<>
			<button
				{...props}
				type={props.type || 'button'}
				onClick={handleClick}
				data-tooltip-id={tooltipText ? tooltipId : undefined}
				data-tooltip-content={tooltipText}
				className={cn('ui-icon-btn', className)}
				style={{ width: 22, height: 22 }}
			>
				{children}
			</button>
			{tooltipText && <Tooltip id={tooltipId} style={{ fontSize: '12px', padding: '4px 8px' }} />}
		</>
	);
}
