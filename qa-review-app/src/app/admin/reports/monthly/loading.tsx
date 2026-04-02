import { TableSkeleton, CardSkeleton } from "@/components/LoadingComponents";

export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Skeleton */}
                <div className="mb-8 animate-pulse">
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-96"></div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>

                {/* Charts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
                        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-6"></div>
                        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
                        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-6"></div>
                        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
                        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
                    </div>
                    <TableSkeleton rows={5} columns={5} />
                </div>
            </div>
        </div>
    );
}
