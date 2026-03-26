import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProgramIndex from '@/components/ProgramIndex';
import { ArrowLeft } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const institution = await prisma.institution.findUnique({ where: { unitid: params.id } });
    const name = institution?.name || 'Institution';
    const baseUrl = 'https://ratemydegrees.com';

    return {
        title: `${name} | Popular Majors, Outcomes, Reviews`,
        description: `Explore popular majors and student outcomes at ${name}. Read verified reviews on academic quality and ROI for this institution.`,
        alternates: {
            canonical: `${baseUrl}/institutions/${params.id}`,
        },
    };
}

export default async function InstitutionPage({
    params,
    searchParams
}: {
    params: { id: string },
    searchParams: { page?: string; q?: string }
}) {
    const page = parseInt(searchParams.page || '1');
    const query = searchParams.q || '';
    const PAGE_SIZE = 12;

    const institution = await prisma.institution.findUnique({
        where: { unitid: params.id },
        include: {
            _count: {
                select: { reviews: { where: { status: 'APPROVED' } } }
            }
        }
    });

    if (!institution) {
        notFound();
    }

    // Filter conditions for offered majors
    const whereClause = {
        unitid: params.id,
        major: {
            OR: [
                { title: { contains: query } },
                { cip4: { contains: query } },
                { category: { contains: query } }
            ]
        }
    };

    // Parallel fetch for count and current page
    const [totalCount, offeredMajorsPage] = await Promise.all([
        prisma.institutionMajor.count({ where: whereClause }),
        prisma.institutionMajor.findMany({
            where: whereClause,
            include: { major: true },
            orderBy: { completionsTotal: 'desc' },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE
        })
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const uniqueMajors = offeredMajorsPage.map(om => ({
        id: om.major.cip4,
        name: om.major.title,
        category: om.major.category,
        reviewCount: 0,
        completions: om.completionsTotal
    }));

    return (
        <div className="container mx-auto px-6 py-10 max-w-7xl">
            <Breadcrumbs
                items={[
                    { label: 'Schools', href: '/institutions' },
                    { label: institution.name, href: `/institutions/${institution.unitid}` }
                ]}
            />

            <div className="mb-12 border-b-2 border-earth-sage/20 pb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="bg-earth-sage/10 border border-earth-sage px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-earth-sage rounded-full">{institution.control}</span>
                            <span className="text-earth-terracotta font-bold uppercase tracking-widest text-[10px]">{page > 1 ? `Page ${page}` : 'Catalog Root'}</span>
                        </div>
                        <h1 className="text-7xl font-funky text-foreground tracking-tight leading-[0.85]">{institution.name}</h1>
                    </div>
                    <a href={`/write-review?institutionId=${institution.unitid}`} className="coffee-btn px-10 py-5 text-xl w-full md:w-auto text-center">
                        Write a Review
                    </a>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="border-r border-earth-sage/20 pr-6">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-sage block mb-1 opacity-60">Insights Shared</span>
                        <div className="text-2xl font-funky text-foreground italic flex items-baseline gap-2">
                            {institution._count.reviews} <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 italic">Reviews</span>
                        </div>
                    </div>
                    <div className="border-r border-earth-sage/20 pr-6">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-sage block mb-1 opacity-60">Control</span>
                        <div className="text-2xl font-funky text-foreground italic uppercase">{institution.control?.split('_')[0]}</div>
                    </div>
                    <div className="border-r border-earth-sage/20 pr-6">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-sage block mb-1 opacity-60">Location</span>
                        <div className="text-2xl font-funky text-foreground italic">{institution.state}</div>
                    </div>
                    <div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-sage block mb-1 opacity-60">UNITID</span>
                        <div className="text-2xl font-funky text-foreground italic">{institution.unitid}</div>
                    </div>
                </div>
            </div>

            <div className="mb-16">
                <ProgramIndex
                    majors={uniqueMajors}
                    unitid={institution.unitid}
                    totalPages={totalPages}
                    currentPage={page}
                    query={query}
                />
            </div>
        </div>
    );
}
