import { parsePage, searchText } from '@/lib/navigation';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProgramIndex from '@/components/ProgramIndex';
import { searchInstitutionDegrees } from '@/lib/institution-degree-search';

import Breadcrumbs from '@/components/Breadcrumbs';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const institution = await prisma.institution.findUnique({ where: { unitid: params.id } });
    const name = institution?.name || 'Institution';
    const baseUrl = 'https://ratemydegrees.com';

    return {
        title: `${name} | Student degree reviews`,
        description: `Read student degree experiences at ${name}. Read firsthand student reviews of degrees at this school.`,
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
    const page = parsePage(searchParams.page);
    const query = searchText(searchParams.q);
    const PAGE_SIZE = 12;

    const institution = await prisma.institution.findUnique({
        where: { unitid: params.id },
        include: {
            _count: {
                select: { reviews: { where: { status: 'APPROVED' } } }
            }
        }
    });

    if (!institution || !institution.active) {
        notFound();
    }

    const { items: uniqueMajors, totalPages } = await searchInstitutionDegrees(params.id, query, page, PAGE_SIZE);

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
                            <span className="text-earth-terracotta font-bold uppercase tracking-widest text-[10px]">{page > 1 ? `Page ${page}` : 'Degree reviews'}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl break-words font-funky text-foreground tracking-tight leading-[0.85]">{institution.name}</h1>
                    </div>
                    <a href={`/write-review?institutionId=${institution.unitid}`} className="coffee-btn px-10 py-5 text-xl w-full md:w-auto text-center">
                        Write a Review
                    </a>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="border-r border-earth-sage/20 pr-6">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-sage block mb-1 opacity-60">Student reviews</span>
                        <div className="text-2xl font-funky text-foreground italic flex items-baseline gap-2">
                            {institution._count.reviews} <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 italic">{institution._count.reviews === 1 ? 'review' : 'reviews'}</span>
                        </div>
                    </div>
                    <div className="border-r border-earth-sage/20 pr-6">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-sage block mb-1 opacity-60">School type</span>
                        <div className="text-2xl font-funky text-foreground italic uppercase">{institution.control?.split('_')[0]}</div>
                    </div>
                    <div className="border-r border-earth-sage/20 pr-6">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-sage block mb-1 opacity-60">Location</span>
                        <div className="text-2xl font-funky text-foreground italic">{institution.state}</div>
                    </div>
                    <div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-sage block mb-1 opacity-60">City</span>
                        <div className="text-2xl font-funky text-foreground italic">{institution.city}</div>
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
