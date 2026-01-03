'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        pages.push(1);

        if (currentPage > 3) {
            pages.push('...');
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }

        if (currentPage < totalPages - 2) {
            pages.push('...');
        }

        if (!pages.includes(totalPages)) {
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
                Previous
            </Button>

            <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                        {page === '...' ? (
                            <span className="px-3 py-2 text-gray-400">...</span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page as number)}
                                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${currentPage === page
                                        ? 'bg-primary-500 text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }
                `}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                rightIcon={<ChevronRight className="w-4 h-4" />}
            >
                Next
            </Button>
        </div>
    );
}
