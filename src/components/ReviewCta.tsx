'use client';

import { trackProductEvent } from '@/lib/product-analytics';

type Source = 'home' | 'degree_detail' | 'school_detail' | 'program_detail';

export default function ReviewCta({ href, source, majorId, institutionId, className, children }: {
    href: string; source: Source; majorId?: string; institutionId?: string; className?: string; children: React.ReactNode;
}) {
    return <a href={href} className={className} onClick={() => {
        void trackProductEvent('review_cta_clicked', { source, major_id: majorId, institution_id: institutionId });
    }}>{children}</a>;
}
