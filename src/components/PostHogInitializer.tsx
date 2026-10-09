'use client';

import { useEffect } from 'react';
import { initializeProductAnalytics } from '@/lib/product-analytics';

export default function PostHogInitializer() {
    useEffect(() => {
        void initializeProductAnalytics();
    }, []);

    return null;
}
