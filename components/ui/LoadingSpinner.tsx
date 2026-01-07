'use client';

import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div className={`
                ${sizeClasses[size]}
                border-blue-200 border-t-blue-600
                rounded-full animate-spin
            `} />
            {text && (
                <p className="mt-4 text-sm text-gray-600">{text}</p>
            )}
        </div>
    );
}
