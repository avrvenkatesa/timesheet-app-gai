
import React, { ReactNode } from 'react';

interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T, index: number) => ReactNode;
    className?: string;
    hideOnMobile?: boolean;
    sortable?: boolean;
}

interface ResponsiveTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T, index: number) => void;
    emptyState?: ReactNode;
    loading?: boolean;
    className?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
    data,
    columns,
    onRowClick,
    emptyState,
    loading,
    className = ''
}: ResponsiveTableProps<T>) {
    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                {emptyState || 'No data available'}
            </div>
        );
    }

    return (
        <div className={`overflow-hidden ${className}`}>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className={`px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider ${column.className || ''}`}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                        {data.map((item, rowIndex) => (
                            <tr
                                key={rowIndex}
                                onClick={() => onRowClick?.(item, rowIndex)}
                                className={`transition-colors duration-200 ${
                                    onRowClick 
                                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer' 
                                        : ''
                                }`}
                            >
                                {columns.map((column, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200 ${column.className || ''}`}
                                    >
                                        {column.render 
                                            ? column.render(item, rowIndex)
                                            : String(item[column.key] || '-')
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {data.map((item, index) => (
                    <div
                        key={index}
                        onClick={() => onRowClick?.(item, index)}
                        className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-2 transition-colors duration-200 ${
                            onRowClick ? 'hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer' : ''
                        }`}
                    >
                        {columns
                            .filter(column => !column.hideOnMobile)
                            .map((column, colIndex) => (
                                <div key={colIndex} className="flex justify-between items-start">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 min-w-0 flex-shrink-0 mr-2">
                                        {column.header}:
                                    </span>
                                    <span className="text-sm text-slate-900 dark:text-slate-200 text-right">
                                        {column.render 
                                            ? column.render(item, index)
                                            : String(item[column.key] || '-')
                                        }
                                    </span>
                                </div>
                            ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
