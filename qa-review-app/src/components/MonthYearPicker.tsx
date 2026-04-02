"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthYearPickerProps {
    selectedMonth: number;
    selectedYear: number;
    onChange: (month: number, year: number) => void;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthYearPicker({ selectedMonth, selectedYear, onChange }: MonthYearPickerProps) {
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1 px-3 py-2">
            <select
                value={selectedMonth}
                onChange={(e) => onChange(parseInt(e.target.value), selectedYear)}
                className="bg-transparent border-none text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-0 cursor-pointer"
            >
                {MONTHS.map((month, index) => (
                    <option key={month} value={index} className="dark:bg-gray-800">
                        {month}
                    </option>
                ))}
            </select>
            <select
                value={selectedYear}
                onChange={(e) => onChange(selectedMonth, parseInt(e.target.value))}
                className="bg-transparent border-none text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-0 cursor-pointer"
            >
                {years.map((year) => (
                    <option key={year} value={year} className="dark:bg-gray-800">
                        {year}
                    </option>
                ))}
            </select>
        </div>
    );
}
