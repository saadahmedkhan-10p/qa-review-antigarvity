import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { SortDirection } from "@/hooks/useTableSort";

interface Props {
    direction: SortDirection;
    active: boolean;
}

export function SortIcon({ direction, active }: Props) {
    if (!active) return <ArrowUpDown className="h-4 w-4 text-gray-400 ml-1 inline-block" />;

    if (direction === 'asc') {
        return <ArrowUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400 ml-1 inline-block" />;
    }

    return <ArrowDown className="h-4 w-4 text-indigo-600 dark:text-indigo-400 ml-1 inline-block" />;
}
