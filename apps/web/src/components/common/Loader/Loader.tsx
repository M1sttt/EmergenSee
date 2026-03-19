import { CONSTS } from './consts';

interface LoaderProps {
	className?: string;
	size?: 'small' | 'medium' | 'large';
	text?: string;
}

export const Loader = ({ className = '', size = 'medium', text }: LoaderProps) => {
	const sizeClass = CONSTS.SIZES[size] || CONSTS.SIZES.medium;

	return (
		<div className={`${CONSTS.CONTAINER} ${className}`}>
			<div className={`${CONSTS.SPINNER} ${sizeClass}`} />
			{text && <p className={CONSTS.TEXT}>{text}</p>}
		</div>
	);
};
