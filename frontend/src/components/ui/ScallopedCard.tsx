import React from 'react';

interface ScallopedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  scallopColor?: string;
  scallopSize?: number; // Radius in px
  children: React.ReactNode;
}

/**
 * A container that renders a solid background with a convex (bumpy) scalloped border
 * on all four sides, matching the visual style of a "stamp" or "cookie".
 */
export const ScallopedCard: React.FC<ScallopedCardProps> = ({
  scallopColor = '#292929', // Default dark
  scallopSize = 8,
  className = '',
  children,
  style,
  ...props
}) => {
  return (
    <div
      className={`scallop-box-convex ${className}`}
      style={
        {
          '--scallop-color': scallopColor,
          '--r': `${scallopSize}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
};