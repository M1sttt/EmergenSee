import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { NavigationLink } from './utils';

interface SidebarNavigationProps {
	navigation: NavigationLink[];
	isSidebarExpanded: boolean;
	currentPath: string;
}

export function SidebarNavigation({
	navigation,
	isSidebarExpanded,
	currentPath,
}: SidebarNavigationProps) {
	return (
		<nav className={cn('flex-1 space-y-1 py-4', isSidebarExpanded ? 'px-4' : 'px-2')}>
			{navigation.map(item => {
				const active = currentPath === item.href;
				const isEmergency = !!item.isEmergency;
				const needsPulse = !!item.needsPulse;
				const { Icon } = item;

				const baseClasses = cn(
					'flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors',
					isEmergency
						? active
							? 'bg-red-600 text-white'
							: cn('bg-red-500 text-white shadow-md hover:bg-red-600', needsPulse && 'animate-pulse')
						: active
							? 'bg-blue-50 text-blue-700'
							: 'text-gray-700 hover:bg-gray-50',
				);

				return (
					<Link
						key={item.name}
						to={item.href}
						title={!isSidebarExpanded ? item.name : undefined}
						className={cn(baseClasses, !isSidebarExpanded && 'justify-center px-2')}
					>
						<span className={cn('text-lg', isSidebarExpanded && 'mr-3')}>
							<Icon />
						</span>
						{isSidebarExpanded && item.name}
					</Link>
				);
			})}
		</nav>
	);
}