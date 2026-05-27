import { HTMLAttributes } from 'react';
import { UiTone } from '@/consts/ui';
import { cn } from '@/utils/cn';

const toneClassMap: Record<UiTone, string> = {
	neutral: 'ui-badge-neutral',
	info: 'ui-badge-info',
	success: 'ui-badge-success',
	warning: 'ui-badge-warning',
	orange: 'ui-badge-orange',
	danger: 'ui-badge-danger',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	tone?: UiTone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
	return <span {...props} className={cn('ui-badge', toneClassMap[tone], className)} />;
}
