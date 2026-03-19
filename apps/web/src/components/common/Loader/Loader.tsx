import * as consts from './consts';

interface LoaderProps {
    className?: string;
    size?: 'small' | 'medium' | 'large';
    text?: string;
}

export const Loader = ({ className = '', size = 'medium', text }: LoaderProps) => {
    const sizeMap = {
        small: consts.smallSizeClass,
        medium: consts.mediumSizeClass,
        large: consts.largeSizeClass,
    } as const;
    const sizeClass = sizeMap[size] || consts.mediumSizeClass;

    return (
        <div className={`${consts.containerClass} ${className}`}>
            <div className={`${consts.spinnerClass} ${sizeClass}`} />
            {text && <p className={consts.textClass}>{text}</p>}
        </div>
    );
};
