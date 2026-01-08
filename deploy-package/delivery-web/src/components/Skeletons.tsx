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

// Delivery Card Skeleton
export const DeliveryCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="mt-4 flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
        </div>
    </div>
);

// List Skeleton
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
    <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
            <DeliveryCardSkeleton key={i} />
        ))}
    </div>
);

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => (
    <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
        </div>

        {/* Active Deliveries */}
        <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <ListSkeleton count={3} />
        </div>
    </div>
);

export default {
    Skeleton,
    StatCardSkeleton,
    DeliveryCardSkeleton,
    ListSkeleton,
    DashboardSkeleton,
};
