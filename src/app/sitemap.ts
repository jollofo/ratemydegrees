import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://ratemydegrees.com';

    // Fetch all active institutions and majors
    const [institutions, majors] = await Promise.all([
        prisma.institution.findMany({
            where: { active: true },
            select: { unitid: true, updatedAt: true }
        }),
        prisma.major.findMany({
            select: { cip4: true, updatedAt: true }
        })
    ]);

    const institutionUrls: MetadataRoute.Sitemap = institutions.map((inst) => ({
        url: `${baseUrl}/institutions/${inst.unitid}`,
        lastModified: inst.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    const majorUrls: MetadataRoute.Sitemap = majors.map((major) => ({
        url: `${baseUrl}/majors/${major.cip4}`,
        lastModified: major.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/institutions`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/majors`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/write-review`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        ...institutionUrls,
        ...majorUrls,
    ];
}
