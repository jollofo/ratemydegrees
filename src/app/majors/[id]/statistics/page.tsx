import prisma from '@/lib/prisma';
import Breadcrumbs from '@/components/Breadcrumbs';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';

const PAGE_SIZE = 20;

function awardName(level: number) {
    if (level === 7) return 'Master’s degree';
    if (level === 17) return 'Research doctorate';
    if (level === 18) return 'Professional doctorate';
    return 'Other doctorate';
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const major = await prisma.major.findUnique({ where: { cip4: params.id }, select: { title: true } });
    return { title: `${major?.title || 'Major'} | Salary, Jobs and Graduate School` };
}

export default async function OpportunitiesPage({ params, searchParams }: {
    params: { id: string };
    searchParams: { degree?: string; q?: string; page?: string };
}) {
    const major = await prisma.major.findUnique({ where: { cip4: params.id }, select: { cip4: true, title: true } });
    if (!major) notFound();
    const majorCip4 = major.cip4;
    const displayTitle = major.title.replace(/[.\s]+$/, '');

    const degree = searchParams.degree === 'masters' || searchParams.degree === 'doctorate' ? searchParams.degree : 'all';
    const query = (searchParams.q || '').trim().slice(0, 100);
    const requestedPage = Number(searchParams.page);
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    const where: Prisma.GraduateProgramWhereInput = {
        cip4: major.cip4,
        institution: { active: true, ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}) },
        ...(degree === 'masters' ? { awardLevel: 7 } : degree === 'doctorate' ? { awardLevel: { in: [17, 18, 19] } } : {})
    };
    const [nationalEarnings, occupations, graduatePrograms, graduateCount] = await Promise.all([
        prisma.scorecardNationalEarnings.findUnique({ where: { cip4_credentialLevel: { cip4: major.cip4, credentialLevel: 3 } } }),
        prisma.majorOccupation.findMany({ where: { cip4: major.cip4 }, orderBy: [{ matchedCip6Count: 'desc' }, { title: 'asc' }] }),
        prisma.graduateProgram.findMany({ where, include: { institution: { select: { name: true } } }, orderBy: [{ completionsTotal: 'desc' }, { unitid: 'asc' }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
        prisma.graduateProgram.count({ where })
    ]);

    function href(nextPage: number, nextDegree = degree) {
        const params = new URLSearchParams();
        if (nextDegree !== 'all') params.set('degree', nextDegree);
        if (query) params.set('q', query);
        if (nextPage > 1) params.set('page', String(nextPage));
        const suffix = params.toString();
        return `/majors/${majorCip4}/statistics${suffix ? `?${suffix}` : ''}#graduate-study`;
    }

    return (
        <div className="container mx-auto px-6 py-16 max-w-7xl">
            <Breadcrumbs items={[
                { label: 'Majors', href: '/majors' },
                { label: major.title, href: `/majors/${major.cip4}` },
                { label: 'Degree statistics', href: `/majors/${major.cip4}/statistics` }
            ]} />

            <div className="mb-16 border-b-2 border-earth-sage/20 pb-10">
                <p className="text-xs font-bold uppercase tracking-widest text-earth-terracotta mb-4">After this degree</p>
                <h1 className="text-5xl md:text-6xl font-funky text-foreground italic mb-5">Degree statistics</h1>
                <p className="text-lg text-foreground/70 max-w-3xl">Explore salary, related jobs, and graduate schools for {displayTitle}. These published figures describe past outcomes and possible paths. They are supplementary information, not recommendations.</p>
                <p className="mt-4 max-w-3xl">Student reviews add firsthand context from people who studied this degree. <a href={`/majors/${major.cip4}#student-reviews`} className="font-bold underline underline-offset-4">Read student reviews →</a></p>
                <nav aria-label="Statistics sections" className="flex flex-wrap gap-3 mt-8 text-sm font-bold text-earth-sage">
                    <a href="#salary" className="hover:text-earth-terracotta underline underline-offset-4">Salary</a>
                    <a href="#careers" className="hover:text-earth-terracotta underline underline-offset-4">Jobs</a>
                    <a href="#graduate-study" className="hover:text-earth-terracotta underline underline-offset-4">Grad school</a>
                </nav>
            </div>

            <section id="salary" className="mb-20 scroll-mt-8">
                <h2 className="text-3xl font-funky text-foreground italic mb-3">Salary</h2>
                {nationalEarnings ? (
                    <div className="coffee-card bg-earth-burgundy text-earth-parchment max-w-2xl">
                        <p className="text-5xl font-funky text-earth-mustard">${nationalEarnings.medianEarnings4Yr.toLocaleString('en-US')}</p>
                        <p className="text-base mt-2">Median annual earnings 4 years after a bachelor&apos;s degree</p>
                        {nationalEarnings.p25Earnings4Yr !== null && nationalEarnings.p75Earnings4Yr !== null && (
                            <p className="text-sm text-earth-parchment/80 mt-4">Middle half of graduates: ${nationalEarnings.p25Earnings4Yr.toLocaleString('en-US')}–${nationalEarnings.p75Earnings4Yr.toLocaleString('en-US')}</p>
                        )}
                        <p className="text-xs text-earth-parchment/70 mt-5">Based on federally aided graduates who worked and were not enrolled in school. Individual salaries vary.</p>
                        <a className="inline-block mt-4 text-xs underline text-earth-parchment/80" href="https://collegescorecard.ed.gov/data/" target="_blank" rel="noopener noreferrer">Source: College Scorecard</a>
                    </div>
                ) : <p className="text-foreground/60">Published salary data is unavailable for this major.</p>}
            </section>

            <section id="careers" className="mb-20 scroll-mt-8">
                <h2 className="text-3xl font-funky text-foreground italic mb-3">Related jobs</h2>
                <p className="text-sm text-foreground/70 mb-8">These jobs use skills taught in this field. They are examples, not records of where graduates work. Some require further education or experience.</p>
                {occupations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {occupations.map(occupation => (
                            <div key={occupation.socCode} className="coffee-card !p-5 bg-earth-parchment/30">
                                <p className="font-bold text-foreground">{occupation.title}</p>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-foreground/60">No official occupation matches are listed for this field.</p>}
                <a className="inline-block mt-6 text-xs underline text-earth-sage" href="https://nces.ed.gov/ipeds/cipcode/Files/CIP2020_SOC2018_Crosswalk.xlsx" target="_blank" rel="noopener noreferrer">Source: NCES and BLS</a>
            </section>

            <section id="graduate-study" className="scroll-mt-8">
                <h2 className="text-3xl font-funky text-foreground italic mb-3">Grad school</h2>
                <p className="text-sm text-foreground/70 mb-8">Schools below awarded master&apos;s or doctoral degrees in this field in 2024. Past awards do not establish current admissions availability.</p>
                <div className="flex flex-wrap gap-3 mb-6">
                    {(['all', 'masters', 'doctorate'] as const).map(option => (
                        <a key={option} href={href(1, option)} className={`px-5 py-2 rounded-full text-sm font-bold border ${degree === option ? 'bg-earth-sage text-white border-earth-sage' : 'bg-white text-earth-sage border-earth-sage/20 hover:border-earth-sage'}`}>
                            {option === 'all' ? 'All degrees' : option === 'masters' ? 'Master’s' : 'Doctorate'}
                        </a>
                    ))}
                </div>
                <form method="GET" action={`/majors/${major.cip4}/statistics#graduate-study`} className="flex flex-col sm:flex-row gap-3 mb-8 max-w-xl">
                    {degree !== 'all' && <input type="hidden" name="degree" value={degree} />}
                    <SearchAutocomplete id="graduate-school-query" kind="graduate-schools" scope={major.cip4} degree={degree} defaultValue={query} maxLength={100} placeholder="Search schools" ariaLabel="Search graduate schools" />
                    <button className="coffee-btn px-6 py-3" type="submit">Search</button>
                </form>
                <p className="text-xs uppercase tracking-widest font-bold text-earth-sage mb-5">{graduateCount.toLocaleString('en-US')} school-degree records</p>
                {graduatePrograms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {graduatePrograms.map(program => (
                            <a key={`${program.unitid}-${program.awardLevel}`} href={`/institutions/${program.unitid}`} className="coffee-card !p-6 bg-white/70 hover:border-earth-terracotta transition-colors">
                                <p className="font-bold text-foreground">{program.institution.name}</p>
                                <p className="text-sm text-earth-sage mt-2">{awardName(program.awardLevel)} · {program.completionsTotal.toLocaleString('en-US')} degrees awarded in {program.sourceYear}</p>
                            </a>
                        ))}
                    </div>
                ) : <p className="text-foreground/60">No graduate-degree records match these filters.</p>}
                {graduateCount > PAGE_SIZE && (
                    <div className="flex items-center justify-between gap-4 mt-8 text-sm font-bold text-earth-sage">
                        {page > 1 ? <a href={href(page - 1)} className="hover:text-earth-terracotta">← Previous</a> : <span />}
                        <span>Page {page} of {Math.ceil(graduateCount / PAGE_SIZE)}</span>
                        {page * PAGE_SIZE < graduateCount ? <a href={href(page + 1)} className="hover:text-earth-terracotta">Next →</a> : <span />}
                    </div>
                )}
                <a className="inline-block mt-6 text-xs underline text-earth-sage" href="https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx?rtid=1" target="_blank" rel="noopener noreferrer">Source: IPEDS 2024 Completions</a>
            </section>
        </div>
    );
}
