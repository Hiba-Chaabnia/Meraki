import React from 'react';

interface ScallopedBoxProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Background color of the box. */
    bgColor?: string;
    /** Size of the scallop scale (px). Defaults to 20. */
    scallopSize?: number;

    /** Content padding */
    padding?: string;
}

export const ScallopedBox: React.FC<ScallopedBoxProps> = ({
    children,
    className = '',
    bgColor = '#000000',
    scallopSize = 20,
    padding = 'p-8',
    style,
    ...props
}) => {
    // Shared style variables
    const cssVars = {
        '--scallop-bg': bgColor,
        '--scallop-size': `${scallopSize}px`,
        backgroundColor: bgColor,
        ...style,
    } as React.CSSProperties;

    // Default: convex (protruding)
    // Needs the decorative divs for the bumps
    return (
        <div
            className={`scallop-outset relative ${className}`}
            style={{
                ...cssVars,
                // Background color needs to be on the inner content, not the wrapper
                // But for simplicity in this wrapper, we put it on the decorative pieces via var
                backgroundColor: 'transparent'
            }}
            {...props}
        >
            <div className="scallop-outset-top" />
            <div className="scallop-outset-bottom" />
            <div className="scallop-outset-left" />
            <div className="scallop-outset-right" />

            <div className={`relative h-full w-full ${padding}`} style={{ backgroundColor: bgColor }}>
                {children}
            </div>
        </div>
    );
};
