import React, { useId } from 'react';
import { Tooltip } from 'react-tooltip';

export interface ActionIconProps {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    tooltipText: string;
    className?: string;
}

export const ActionIcon: React.FC<ActionIconProps> = ({ children, onClick, className = '', tooltipText }) => {
    const tooltipId = useId();

    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            e.stopPropagation();
            onClick(e);
        }
    };

    return (
        <>
            <div
                data-tooltip-id={tooltipId}
                data-tooltip-content={tooltipText}
                onClick={handleClick}
                style={{ width: '22px', height: '22px' }}
                className={`inline-flex items-center justify-center rounded cursor-pointer transition-colors hover:bg-black/10 ${className}`}
            >
                {children}
            </div>
            <Tooltip id={tooltipId} style={{fontSize: '12px', padding: '4px 8px' }} />
        </>
    );
};