'use client';

import { usePathname } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import Script from 'next/script';

function GATracking({ GA_MEASUREMENT_ID }: { GA_MEASUREMENT_ID: string }) {
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('config', GA_MEASUREMENT_ID, {
                page_path: pathname,
                page_location: window.location.origin + pathname,
            });
        }
    }, [pathname, GA_MEASUREMENT_ID]);

    return null;
}

export default function GoogleAnalytics({ GA_MEASUREMENT_ID }: { GA_MEASUREMENT_ID: string }) {
    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                    page_location: window.location.origin + window.location.pathname,
                });
                `,
                }}
            />
            <Suspense fallback={null}>
                <GATracking GA_MEASUREMENT_ID={GA_MEASUREMENT_ID} />
            </Suspense>
        </>
    );
}
