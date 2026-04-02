import React from 'react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function ColumnFilter({ value, onChange, placeholder }: Props) {
    return (
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder={placeholder || "Search..."}
            onClick={(e) => e.stopPropagation()}
        />
    );
}
