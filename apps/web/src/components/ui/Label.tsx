import { LabelHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
	return <label {...props} className={cn('ui-label', className)} />;
}
