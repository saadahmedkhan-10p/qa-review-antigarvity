import { TableSkeleton } from "@/components/LoadingComponents";

export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 animate-pulse">
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-96"></div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
                        <div className="flex justify-between items-center">
                            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
                            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                        </div>
                    </div>
                    <TableSkeleton rows={8} columns={5} />
                </div>
            </div>
        </div>
    );
}
