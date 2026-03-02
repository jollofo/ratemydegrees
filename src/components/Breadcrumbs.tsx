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
        <nav className="flex mb-8 overflow-x-auto no-scrollbar py-2" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3 whitespace-nowrap">
                <li className="inline-flex items-center">
                    <Link
                        href="/"
                        className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-earth-sage hover:text-earth-terracotta transition-colors"
                    >
                        <Home className="w-3.5 h-3.5 mr-2" />
                        Home
                    </Link>
                </li>
                {items.map((item, index) => (
                    <li key={item.href}>
                        <div className="flex items-center">
                            <ChevronRight className="w-4 h-4 text-earth-sage/30 mx-1" />
                            <Link
                                href={item.href}
                                className={`ml-1 text-xs font-bold uppercase tracking-widest transition-colors ${index === items.length - 1
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
