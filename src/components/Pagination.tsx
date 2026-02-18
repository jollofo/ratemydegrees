import { ArrowLeft, ArrowRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    /** Build the href for a given page number */
    buildHref: (page: number) => string;
}

export default function Pagination({ currentPage, totalPages, buildHref }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pageNumbers = [...Array(Math.min(5, totalPages))].map((_, i) => {
        if (currentPage <= 3) return i + 1;
        if (currentPage >= totalPages - 2) return totalPages - 4 + i;
        return currentPage - 2 + i;
    }).filter((n) => n > 0 && n <= totalPages);

    return (
        <div className="flex justify-center items-center gap-4 pt-16 border-t border-foreground/10">
            {currentPage > 1 && (
                <a
                    href={buildHref(currentPage - 1)}
                    className="w-14 h-14 bg-white border-2 border-foreground rounded-2xl flex items-center justify-center hover:bg-earth-parchment transition-colors"
                    aria-label="Previous page"
                >
                    <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
                </a>
            )}

            <div className="flex items-center gap-3">
                {pageNumbers.map((pageNum) => (
                    <a
                        key={pageNum}
                        href={buildHref(pageNum)}
                        className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 font-bold transition-all ${currentPage === pageNum
                                ? 'bg-earth-terracotta border-earth-terracotta text-white shadow-lg scale-110'
                                : 'bg-white border-foreground hover:bg-earth-parchment'
                            }`}
                        aria-current={currentPage === pageNum ? 'page' : undefined}
                    >
                        {pageNum}
                    </a>
                ))}
            </div>

            {currentPage < totalPages && (
                <a
                    href={buildHref(currentPage + 1)}
                    className="w-14 h-14 bg-white border-2 border-foreground rounded-2xl flex items-center justify-center hover:bg-earth-parchment transition-colors"
                    aria-label="Next page"
                >
                    <ArrowRight className="h-5 w-5 stroke-[2.5]" />
                </a>
            )}
        </div>
    );
}
