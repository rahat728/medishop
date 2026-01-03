'use client';

import React, { useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Search,
    Filter,
    MoreVertical,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface Column<T> {
    key: string;
    header: string;
    sortable?: boolean;
    width?: string;
    render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    emptyIcon?: React.ComponentType<{ className?: string }>;

    // Pagination
    pagination?: {
        page: number;
        limit: number;
        total: number;
        onPageChange: (page: number) => void;
        onLimitChange?: (limit: number) => void;
    };

    // Sorting
    sorting?: {
        column: string;
        direction: 'asc' | 'desc';
        onSort: (column: string) => void;
    };

    // Search
    search?: {
        value: string;
        placeholder?: string;
        onChange: (value: string) => void;
    };

    // Selection
    selection?: {
        selected: string[];
        onSelect: (ids: string[]) => void;
        idKey?: string;
    };

    // Row actions
    onRowClick?: (row: T, index: number) => void;
    rowActions?: (row: T, index: number) => React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    loading = false,
    emptyMessage = 'No data available',
    emptyIcon: EmptyIcon,
    pagination,
    sorting,
    search,
    selection,
    onRowClick,
    rowActions,
}: DataTableProps<T>) {
    const [showFilters, setShowFilters] = useState(false);

    const idKey = selection?.idKey || '_id';
    const allSelected = data.length > 0 && data.every(row =>
        selection?.selected.includes(row[idKey])
    );

    const handleSelectAll = () => {
        if (!selection) return;
        if (allSelected) {
            selection.onSelect([]);
        } else {
            selection.onSelect(data.map(row => row[idKey]));
        }
    };

    const handleSelectRow = (id: string) => {
        if (!selection) return;
        if (selection.selected.includes(id)) {
            selection.onSelect(selection.selected.filter(s => s !== id));
        } else {
            selection.onSelect([...selection.selected, id]);
        }
    };

    const renderSortIcon = (column: Column<T>) => {
        if (!column.sortable || !sorting) return null;

        if (sorting.column !== column.key) {
            return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
        }

        return sorting.direction === 'asc'
            ? <ArrowUp className="w-4 h-4 text-primary-600" />
            : <ArrowDown className="w-4 h-4 text-primary-600" />;
    };

    const renderCell = (column: Column<T>, row: T, index: number) => {
        const value = column.key.split('.').reduce((obj, key) => obj?.[key], row);

        if (column.render) {
            return column.render(value, row, index);
        }

        return value ?? '-';
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {search && (
                    <div className="p-4 border-b border-gray-100">
                        <div className="h-10 bg-gray-100 rounded-lg animate-pulse w-64" />
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                {columns.map((col, i) => (
                                    <th key={i} className="px-6 py-3 text-left">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-gray-50">
                                    {columns.map((_, j) => (
                                        <td key={j} className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
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

    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Search Bar */}
            {search && (
                <div className="p-4 border-b border-gray-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search.value}
                            onChange={(e) => search.onChange(e.target.value)}
                            placeholder={search.placeholder || 'Search...'}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg border transition-colors ${showFilters
                                ? 'bg-primary-50 border-primary-200 text-primary-600'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Selection Info */}
            {selection && selection.selected.length > 0 && (
                <div className="px-4 py-2 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
                    <span className="text-sm text-primary-700">
                        {selection.selected.length} item(s) selected
                    </span>
                    <button
                        onClick={() => selection.onSelect([])}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Clear selection
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {selection && (
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''
                                        }`}
                                    style={{ width: column.width }}
                                    onClick={() => column.sortable && sorting?.onSort(column.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.header}
                                        {renderSortIcon(column)}
                                    </div>
                                </th>
                            ))}
                            {rowActions && (
                                <th className="px-6 py-3 w-10" />
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (selection ? 1 : 0) + (rowActions ? 1 : 0)}
                                    className="px-6 py-12 text-center"
                                >
                                    <div className="flex flex-col items-center">
                                        {EmptyIcon && (
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <EmptyIcon className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                        <p className="text-gray-500">{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => (
                                <tr
                                    key={row[idKey] || index}
                                    className={`
                    hover:bg-gray-50 transition-colors
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${selection?.selected.includes(row[idKey]) ? 'bg-primary-50/50' : ''}
                  `}
                                    onClick={() => onRowClick?.(row, index)}
                                >
                                    {selection && (
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selection.selected.includes(row[idKey])}
                                                onChange={() => handleSelectRow(row[idKey])}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </td>
                                    )}
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                                            {renderCell(column, row, index)}
                                        </td>
                                    ))}
                                    {rowActions && (
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            {rowActions(row, index)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Show</span>
                        <select
                            value={pagination.limit}
                            onChange={(e) => pagination.onLimitChange?.(Number(e.target.value))}
                            className="border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>of {pagination.total} entries</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => pagination.onPageChange(1)}
                            disabled={pagination.page === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="px-4 py-2 text-sm">
                            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                        </span>

                        <button
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => pagination.onPageChange(Math.ceil(pagination.total / pagination.limit))}
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
