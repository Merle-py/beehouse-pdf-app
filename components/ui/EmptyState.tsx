'use client';

import React from 'react';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-50">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                {description}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="btn-primary"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
