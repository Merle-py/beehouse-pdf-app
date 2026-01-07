'use client';

import React from 'react';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: string;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
    subtitle?: string;
}

export default function StatsCard({
    title,
    value,
    icon,
    color = 'blue',
    subtitle
}: StatsCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        green: 'bg-green-50 text-green-600 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        red: 'bg-red-50 text-red-600 border-red-200'
    };

    return (
        <div className={`p-6 rounded-lg border-2 ${colorClasses[color]} transition-all hover:shadow-md`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-semibold opacity-75 mb-1">{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                    {subtitle && (
                        <p className="text-xs opacity-60 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className="text-4xl opacity-50">
                    {icon}
                </div>
            </div>
        </div>
    );
}
