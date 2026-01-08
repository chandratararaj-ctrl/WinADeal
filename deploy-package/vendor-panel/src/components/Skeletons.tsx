import React from 'react';

// Base Skeleton Component
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Stat Card Skeleton
export const StatCardSkeleton: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
        </div>
    </div>
);

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
    <tr className="border-b border-gray-200">
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="px-6 py-4">
                <Skeleton className="h-4 w-full" />
            </td>
        ))}
    </tr>
);

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 5
}) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    {Array.from({ length: columns }).map((_, i) => (
                        <th key={i} className="px-6 py-3">
                            <Skeleton className="h-4 w-20" />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: rows }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={columns} />
                ))}
            </tbody>
        </table>
    </div>
);

// Product Card Skeleton
export const ProductCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Skeleton className="h-48 w-full" />
        <div className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <Skeleton className="h-6 w-24 mb-3" />
            <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-9" />
            </div>
        </div>
    </div>
);

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
            <ProductCardSkeleton key={i} />
        ))}
    </div>
);

// Chart Skeleton
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className={`w-full ${height}`} />
    </div>
);

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => (
    <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
        </div>

        {/* Table */}
        <TableSkeleton rows={5} columns={6} />
    </div>
);

export default {
    Skeleton,
    StatCardSkeleton,
    TableRowSkeleton,
    TableSkeleton,
    ProductCardSkeleton,
    ProductGridSkeleton,
    ChartSkeleton,
    DashboardSkeleton,
};
