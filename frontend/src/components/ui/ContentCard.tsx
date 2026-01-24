import React from 'react';
import { ScallopedBox } from './ScallopedBox';
import { ImageContainer } from './ImageContainer';
import { Badge } from './Badge';

interface ContentCardProps {
    title: string;
    description: string;
    image?: string;
    imageAlt?: string;
    icon?: React.ReactNode;
    badge?: string;
    bgColor?: string;
    accentColor?: string;
    layout?: 'vertical' | 'horizontal';
    className?: string;
}

export const ContentCard: React.FC<ContentCardProps> = ({
    title,
    description,
    image,
    imageAlt = '',
    icon,
    badge,
    bgColor = 'rgba(255, 145, 73, 0.1)',
    accentColor = '#FF9149',
    layout = 'vertical',
    className = ''
}) => {
    const isVertical = layout === 'vertical';

    return (
        <ScallopedBox
            bgColor="white"
            scallopSize={16}
            className={`w-full hover:shadow-2xl transition-shadow duration-300 ${className}`}
            padding="p-0"
        >
            <div className={`p-8 ${isVertical ? 'flex flex-col items-center text-center' : 'flex flex-col md:flex-row gap-8 items-center'}`}>
                {/* Badge (if provided) */}
                {badge && (
                    <Badge
                        bgColor={bgColor}
                        textColor={accentColor}
                        size="lg"
                        className="mb-6"
                    >
                        {badge}
                    </Badge>
                )}

                {/* Icon or Image */}
                {icon && (
                    <div className="text-7xl mb-6">
                        {icon}
                    </div>
                )}

                {image && (
                    <ImageContainer
                        src={image}
                        alt={imageAlt}
                        bgColor={bgColor}
                        size="md"
                        className="mb-6"
                    />
                )}

                {/* Content */}
                <div className={isVertical ? '' : 'flex-1'}>
                    <h3
                        className={`font-serif font-bold text-2xl md:text-3xl mb-4 ${isVertical ? '' : 'tracking-tight'}`}
                        style={{ color: accentColor }}
                    >
                        {title}
                    </h3>
                    <p className={`text-gray-700 leading-relaxed text-lg ${isVertical ? '' : 'md:text-xl'}`}>
                        {description}
                    </p>
                </div>
            </div>
        </ScallopedBox>
    );
};
