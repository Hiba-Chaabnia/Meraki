import React from 'react';

interface SectionHeadlineProps {
    title: string;
    accentText?: string;
    subtitle?: string;
    align?: 'left' | 'center';
    className?: string;
}

export const SectionHeadline: React.FC<SectionHeadlineProps> = ({
    title,
    accentText,
    subtitle,
    align = 'center',
    className = ''
}) => {
    const alignClass = align === 'center' ? 'text-center' : 'text-left';

    return (
        <div className={`${alignClass} ${className}`}>
            <h2 className="font-serif font-black text-5xl md:text-6xl text-[var(--foreground)] leading-tight mb-6">
                {title}
                {accentText && (
                    <>
                        {' '}<br />
                        <span className="text-[var(--coral)]">{accentText}</span>
                    </>
                )}
            </h2>
            {subtitle && (
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    {subtitle}
                </p>
            )}
        </div>
    );
};
