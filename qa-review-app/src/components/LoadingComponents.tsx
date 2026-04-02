import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className={`inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size]} ${className}`} role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
            </span>
        </div>
    );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    children: React.ReactNode;
    loadingText?: string;
}

export function LoadingButton({ loading = false, children, loadingText, disabled, className = '', ...props }: LoadingButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            className={`relative ${className} ${loading || disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            {...props}
        >
            {loading && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <Spinner size="sm" className="text-current" />
                </span>
            )}
            <span className={loading ? 'invisible' : ''}>
                {loading && loadingText ? loadingText : children}
            </span>
        </button>
    );
}

export function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <Spinner size="lg" className="text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="animate-pulse">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            {Array.from({ length: columns }).map((_, i) => (
                                <th key={i} className="px-6 py-3">
                                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr key={rowIndex}>
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
    );
}
