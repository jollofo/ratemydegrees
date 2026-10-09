'use client';

import { useEffect } from 'react';
import { identifyProductAnalytics, initializeProductAnalytics } from '@/lib/product-analytics';

export default function PostHogInitializer({ userId, email }: { userId: string | null; email: string | null }) {
    useEffect(() => {
        if (userId) {
            void identifyProductAnalytics(userId, email ?? undefined);
            return;
        }
        void initializeProductAnalytics();
    }, [email, userId]);

    return null;
}
