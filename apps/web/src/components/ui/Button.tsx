import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClassMap: Record<ButtonVariant, string> = {
	primary: 'ui-btn-primary',
	secondary: 'ui-btn-secondary',
	danger: 'ui-btn-danger',
	ghost: 'ui-btn-ghost',
};

const sizeClassMap: Record<ButtonSize, string> = {
	sm: 'ui-btn-sm',
	md: 'ui-btn-md',
	lg: 'ui-btn-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = 'primary', size = 'md', fullWidth = false, className, type, ...props }, ref) => {
		return (
			<button
				{...props}
				ref={ref}
				type={type || 'button'}
				className={cn(
					'ui-btn',
					variantClassMap[variant],
					sizeClassMap[size],
					fullWidth && 'w-full',
					className,
				)}
			/>
		);
	},
);

Button.displayName = 'Button';
