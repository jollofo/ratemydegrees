import { ArrowLeft } from 'lucide-react';

interface BackLinkProps {
    href: string;
    label: string;
}

export default function BackLink({ href, label }: BackLinkProps) {
    return (
        <a
            href={href}
            className="inline-flex items-center text-sm font-bold text-earth-terracotta hover:underline mb-12"
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {label}
        </a>
    );
}
