import React, { useState } from 'react';

interface ScallopedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'filled' | 'outline';
    scallopSize?: 'sm' | 'md' | 'lg';
    scallopType?: 'convex' | 'concave';

    // Normal State Colors
    bgColor?: string;       // For filled variant. Default: gray-900 (#111827)
    borderColor?: string;   // For outline variant. Default: gray-900 (#111827)
    textColor?: string;     // Default: white (filled) or gray-900 (outline)

    // Hover State Colors
    hoverBgColor?: string;     // If set, background changes to this on hover
    hoverBorderColor?: string; // If set, border changes to this on hover (outline only)
    hoverTextColor?: string;   // If set, text changes to this on hover

    /**
     * Width of the simulated border in pixels (only for outline variant).
     * Default: 2
     */
    borderWidth?: number;

    /**
     * For the 'outline' variant, we need to know the background color of the parent container
     * to visually "cut out" the shape. Defaults to 'transparents' but practically needs to match parent.
     * Default: var(--background)
     */
    parentBg?: string;
}

export const ScallopedButton: React.FC<ScallopedButtonProps> = ({
    children,
    className = '',
    variant = 'filled',
    scallopSize = 'sm',
    scallopType = 'convex',

    // Default Colors
    bgColor = '#111827', // gray-900
    borderColor = '#111827',
    textColor, // defaults derived below

    // Hover Defaults
    hoverBgColor,
    hoverBorderColor,
    hoverTextColor,

    parentBg = 'var(--background)',
    borderWidth = 2,
    style,
    ...props
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // Determine derived text color defaults if not provided
    const defaultTextColor = variant === 'filled' ? '#ffffff' : borderColor;
    const finalTextColor = isHovered
        ? (hoverTextColor || (variant === 'filled' ? defaultTextColor : (hoverBorderColor || borderColor)))
        : (textColor || defaultTextColor);

    // Determine Active Background
    let activeBg = bgColor;
    if (variant === 'outline') {
        // Outline normal: parentBg (transparent-ish)
        // Outline hover: hoverBgColor if provided, else parentBg
        activeBg = (isHovered && hoverBgColor) ? hoverBgColor : parentBg;
    } else {
        // Filled normal: bgColor
        // Filled hover: hoverBgColor if provided, else bgColor
        activeBg = (isHovered && hoverBgColor) ? hoverBgColor : bgColor;
    }

    // Determine Active Scallop Color
    // For filled: matches active background
    // For outline: matches active background (to hide seams)
    // Wait, for outline, the 'scallop color' (the SVG fill) must match the background of the button
    // which is 'activeBg'.
    const scallopFillColor = activeBg;

    // Determine Active Border Color (Outline only)
    const activeBorder = (isHovered && hoverBorderColor) ? hoverBorderColor : borderColor;


    // Base Layout Styles
    const baseButton = "group relative inline-flex items-center justify-center font-medium transition-transform hover:scale-105 active:scale-95 m-2 cursor-pointer";

    // Content Wrapper Styles
    const shapePadding = "px-8 py-4";
    const scallopClasses = `scallop-${scallopSize}`;

    // Dynamic Styles for Drop-Shadow Border (Outline Variant)
    let wrapperStyle: React.CSSProperties = { ...style };

    if (variant === 'outline') {
        // Calculate drop shadow filter for border
        // We use 4 shadows to simulate a stroke
        const sColor = activeBorder;
        const bWidth = borderWidth;
        const shadowFn = (x: number, y: number) => `drop-shadow(${x}px ${y}px 0 ${sColor})`;

        wrapperStyle.filter = [
            shadowFn(bWidth, 0),
            shadowFn(-bWidth, 0),
            shadowFn(0, bWidth),
            shadowFn(0, -bWidth)
        ].join(' ');
    }

    // Map the prop size to the globabl CSS class
    const sizeClass = {
        sm: 'scallop-sm',
        md: 'scallop-md',
        lg: 'scallop-lg'
    }[scallopSize] || 'scallop-md';

    const cssVars = {
        '--scallop-bg': scallopFillColor,
        ...wrapperStyle
    } as React.CSSProperties;

    if (scallopType === 'concave') {
        const concaveScallopClasses = sizeClass;
        return (
            <button
                className={`${baseButton} ${className}`}
                style={cssVars}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                {...props}
            >
                <div
                    className={`relative z-0 ${shapePadding} ${concaveScallopClasses} scallop-top scallop-right transition-colors duration-300`}
                    style={{
                        backgroundColor: scallopFillColor,
                        color: scallopFillColor,
                    }}
                >
                    <div
                        className={`!absolute inset-0 ${concaveScallopClasses} scallop-bottom scallop-left transition-colors duration-300`}
                        style={{
                            backgroundColor: scallopFillColor,
                            color: scallopFillColor
                        }}
                    />
                    <span
                        className="relative z-10 font-serif tracking-wide transition-colors duration-300"
                        style={{ color: finalTextColor }}
                    >
                        {children}
                    </span>
                </div>
            </button>
        );
    }

    return (
        <button
            className={`${baseButton} ${className}`}
            style={cssVars}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            {...props}
        >
            <div className={`scallop-outset relative ${sizeClass}`}>
                <div className="scallop-outset-top" />
                <div className="scallop-outset-bottom" />
                <div className="scallop-outset-left" />
                <div className="scallop-outset-right" />

                <div
                    className={`relative z-10 ${shapePadding} transition-colors duration-300`}
                    style={{ backgroundColor: scallopFillColor }}
                >
                    <span
                        className="font-serif tracking-wide transition-colors duration-300"
                        style={{ color: finalTextColor }}
                    >
                        {children}
                    </span>
                </div>
            </div>
        </button>
    );
};
