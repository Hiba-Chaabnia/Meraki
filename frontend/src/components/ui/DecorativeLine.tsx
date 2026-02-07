import React from 'react';

interface DecorativeLineProps {
    label: string;
    color?: string;
    lineWidth?: string;
    className?: string;
}

export const DecorativeLine: React.FC<DecorativeLineProps> = ({
    label,
    color = 'var(--coral)',
    lineWidth = 'w-12',
    className = ''
}) => {
    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <div
                className={`${lineWidth} h-1 rounded-full`}
                style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-500 font-semibold tracking-wider uppercase">
                {label}
            </span>
        </div>
    );
};
