import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    bgColor?: string;
    textColor?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    bgColor = 'rgba(255, 145, 73, 0.1)',
    textColor = '#FF9149',
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-4 py-2 text-2xl'
    };

    return (
        <div
            className={`inline-flex items-center justify-center rounded-full font-black ${sizeClasses[size]} ${className}`}
            style={{
                backgroundColor: bgColor,
                color: textColor
            }}
        >
            {children}
        </div>
    );
};
