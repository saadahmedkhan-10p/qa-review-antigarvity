import { useState, useMemo } from 'react';

export function useTableSearch<T>(data: T[]) {
    const [searchFilters, setSearchFilters] = useState<Record<string, string>>({});

    const handleSearch = (key: string, value: string) => {
        setSearchFilters((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    const filteredData = useMemo(() => {
        return data.filter((item: any) => {
            return Object.entries(searchFilters).every(([key, value]) => {
                if (!value) return true;

                // Handle nested properties (e.g., 'lead.name')
                const getValue = (obj: any, path: string) => {
                    return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
                };

                const itemValue = getValue(item, key);

                if (itemValue === null || itemValue === undefined) return false;

                return String(itemValue).toLowerCase().includes(value.toLowerCase());
            });
        });
    }, [data, searchFilters]);

    return { filteredData, searchFilters, handleSearch };
}
