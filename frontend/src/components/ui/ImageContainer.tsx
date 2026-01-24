import React from 'react';
import Image from 'next/image';

interface ImageContainerProps {
    src: string;
    alt: string;
    bgColor?: string;
    size?: 'sm' | 'md' | 'lg';
    rounded?: boolean;
    className?: string;
}

export const ImageContainer: React.FC<ImageContainerProps> = ({
    src,
    alt,
    bgColor = 'rgba(255, 145, 73, 0.1)',
    size = 'md',
    rounded = true,
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-32 h-32',
        md: 'w-48 h-48',
        lg: 'w-64 h-64'
    };

    const imageSizeClasses = {
        sm: 'w-24 h-24',
        md: 'w-40 h-40',
        lg: 'w-56 h-56'
    };

    const roundedClass = rounded ? 'rounded-2xl' : '';

    return (
        <div
            className={`${sizeClasses[size]} flex-shrink-0 ${roundedClass} flex items-center justify-center overflow-hidden ${className}`}
            style={{ backgroundColor: bgColor }}
        >
            <div className={`relative ${imageSizeClasses[size]}`}>
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-contain"
                />
            </div>
        </div>
    );
};
