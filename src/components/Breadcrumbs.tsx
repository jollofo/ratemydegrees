import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="mb-8 min-w-0 py-2" aria-label="Breadcrumb">
            <ol className="flex min-w-0 items-center gap-1 md:gap-3 whitespace-nowrap">
                <li className="inline-flex shrink-0 items-center">
                    <Link
                        href="/"
                        className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-earth-sage hover:text-earth-terracotta transition-colors"
                    >
                        <Home className="w-3.5 h-3.5 mr-2" />
                        Home
                    </Link>
                </li>
                {items.map((item, index) => (
                    <li key={item.href} className={item.label.length > 16 ? 'min-w-0 flex-1' : 'shrink-0'}>
                        <div className="flex min-w-0 items-center">
                            <ChevronRight className="w-4 h-4 shrink-0 text-earth-sage/30 mx-1" />
                            <Link
                                href={item.href}
                                className={`ml-1 block min-w-0 truncate text-xs font-bold uppercase tracking-widest transition-colors ${index === items.length - 1
                                        ? 'text-earth-terracotta pointer-events-none'
                                        : 'text-earth-sage hover:text-earth-terracotta'
                                    }`}
                                aria-current={index === items.length - 1 ? 'page' : undefined}
                            >
                                {item.label}
                            </Link>
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
