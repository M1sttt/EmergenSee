import { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type FieldErrorProps = HTMLAttributes<HTMLParagraphElement>;

export function FieldError({ className, children, ...props }: FieldErrorProps) {
	if (!children) {
		return null;
	}

	return (
		<p {...props} className={cn('ui-field-error', className)}>
			{children}
		</p>
	);
}
