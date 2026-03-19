import React from 'react';
import { IconButton } from '@/components/ui';

export interface ActionIconProps {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    tooltipText: string;
    className?: string;
}

export const ActionIcon: React.FC<ActionIconProps> = ({ children, onClick, className = '', tooltipText }) => {
    return (
        <IconButton onClick={onClick} className={className} tooltipText={tooltipText}>
            {children}
        </IconButton>
    );
};