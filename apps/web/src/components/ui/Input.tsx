import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
	return <input {...props} ref={ref} className={cn('ui-input', className)} />;
});

Input.displayName = 'Input';
