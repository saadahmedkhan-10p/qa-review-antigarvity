import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T> {
    key: keyof T | string;
    direction: SortDirection;
}

export function useTableSort<T>(data: T[], initialSort: SortConfig<T> = { key: '', direction: null }) {
    const [sortConfig, setSortConfig] = useState<SortConfig<T>>(initialSort);

    const handleSort = (key: keyof T | string) => {
        setSortConfig((current) => {
            if (current.key === key) {
                if (current.direction === 'asc') return { key, direction: 'desc' };
                if (current.direction === 'desc') return { key: '', direction: null };
            }
            return { key, direction: 'asc' };
        });
    };

    const sortedData = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) return data;

        return [...data].sort((a: any, b: any) => {
            // Handle nested properties (e.g., 'lead.name')
            const getValue = (obj: any, path: string) => {
                return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
            };

            const aValue = getValue(a, sortConfig.key as string);
            const bValue = getValue(b, sortConfig.key as string);

            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            const comparison = aValue < bValue ? -1 : 1;
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [data, sortConfig]);

    return { sortedData, sortConfig, handleSort };
}
