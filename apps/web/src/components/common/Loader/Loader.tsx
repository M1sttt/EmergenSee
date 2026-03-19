import { cn } from '@/utils/cn';

interface LoaderProps {
    className?: string;
    size?: 'small' | 'medium' | 'large';
    text?: string;
}

export const Loader = ({ className = '', size = 'medium', text }: LoaderProps) => {
    const sizeMap = {
        small: 'h-4 w-4 border-2',
        medium: 'h-8 w-8 border-2',
        large: 'h-12 w-12 border-4',
    } as const;
    const sizeClass = sizeMap[size] || sizeMap.medium;

    return (
        <div className={cn('flex flex-col items-center justify-center p-4', className)}>
            <div className={cn('animate-spin rounded-full border-b-2 border-indigo-600', sizeClass)} />
            {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
        </div>
    );
};
