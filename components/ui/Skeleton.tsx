import React from 'react';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
    );
}

export function CardSkeleton() {
    return (
        <div className="card">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-2/3" />
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <tr className="animate-pulse">
            <td className="px-6 py-4">
                <Skeleton className="h-4 w-32" />
            </td>
            <td className="px-6 py-4">
                <Skeleton className="h-4 w-48" />
            </td>
            <td className="px-6 py-4">
                <Skeleton className="h-4 w-24" />
            </td>
            <td className="px-6 py-4">
                <Skeleton className="h-4 w-20" />
            </td>
        </tr>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">
                            <Skeleton className="h-4 w-24" />
                        </th>
                        <th className="px-6 py-3">
                            <Skeleton className="h-4 w-32" />
                        </th>
                        <th className="px-6 py-3">
                            <Skeleton className="h-4 w-20" />
                        </th>
                        <th className="px-6 py-3">
                            <Skeleton className="h-4 w-16" />
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className="space-y-4">
            <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex gap-4 justify-end">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
    );
}
