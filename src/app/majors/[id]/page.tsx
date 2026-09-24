import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { parsePage, searchText } from '@/lib/navigation';
import { getReviewPage } from '@/lib/review-data';
import ReviewList from '@/components/ReviewList';
import Pagination from '@/components/Pagination';
import Breadcrumbs from '@/components/Breadcrumbs';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const major = await prisma.major.findUnique({ where: { cip4: params.id }, select: { title: true } });
    return { title: (major?.title ?? 'Degree') + ' | Student reviews', description: 'Read firsthand student experiences of this degree, with each school clearly identified.', alternates: { canonical: 'https://ratemydegrees.com/majors/' + params.id } };
}
export default async function MajorPage({ params, searchParams }: { params: { id: string }; searchParams: { q?: string; page?: string; reviewsPage?: string } }) {
    const major = await prisma.major.findUnique({ where: { cip4: params.id }, select: { cip4: true, title: true } });
    if (!major) notFound();
    const { data: { user } } = await createClient().auth.getUser();
    const query = searchText(searchParams.q), page = parsePage(searchParams.page), reviewsPage = parsePage(searchParams.reviewsPage);
    const where = { active: true, name: { contains: query, mode: 'insensitive' as const }, OR: [{ offeredMajors: { some: { cip4: major.cip4 } } }, { reviews: { some: { cip4: major.cip4, status: 'APPROVED' } } }] };
    const [reviewData, schools, schoolCount] = await Promise.all([
        getReviewPage({ cip4: major.cip4 }, user?.id, reviewsPage),
        prisma.institution.findMany({ where, select: { unitid: true, name: true, city: true, state: true, _count: { select: { reviews: { where: { cip4: major.cip4, status: 'APPROVED' } } } } }, orderBy: [{ name: 'asc' }, { unitid: 'asc' }], take: 12, skip: (page - 1) * 12 }),
        prisma.institution.count({ where }),
    ]);
    function href(schoolPage: number, reviewPage: number, anchor: string) {
        const queryParams = new URLSearchParams({ page: String(schoolPage), reviewsPage: String(reviewPage) });
        if(query) queryParams.set('q',query);
        return '/majors/' + major!.cip4 + '?' + queryParams.toString() + '#' + anchor;
    }
    return <div className="max-w-5xl mx-auto px-6 py-10">
        <Breadcrumbs items={[{ label: 'Degrees', href: '/majors' }, { label: major.title, href: '/majors/' + major.cip4 }]} />
        <h1 className="text-4xl sm:text-5xl font-bold break-words mb-4">{major.title.replace(/[.\s]+$/, '')}</h1>
        <p className="text-lg mb-6">Firsthand degree experiences. Each review identifies the school where the student studied.</p>
        <div className="flex flex-wrap gap-5 items-center"><a href={'/write-review?majorId=' + major.cip4} className="coffee-btn">Write a review</a><a href="#schools" className="underline py-3">Find reviews at a school</a></div>
        <section aria-labelledby="degree-statistics-title" className="coffee-card my-10 bg-earth-sage/10">
            <p className="text-sm font-bold uppercase tracking-wide text-earth-burgundy mb-2">Alongside student reviews</p>
            <h2 id="degree-statistics-title" className="text-2xl sm:text-3xl font-bold mb-3">Explore degree statistics</h2>
            <p className="max-w-3xl mb-5">See published salary figures, related jobs, and graduate school records for this degree. Student reviews add firsthand context to these figures.</p>
            <p className="text-sm mb-6">The published data is supplementary, describes past outcomes or possible paths, and is not a recommendation.</p>
            <a href={'/majors/' + major.cip4 + '/statistics'} className="inline-flex items-center font-bold underline underline-offset-4 py-2">View statistics and sources →</a>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm">
                <a className="underline underline-offset-4" href={'/majors/' + major.cip4 + '/statistics#salary'}>Salary</a>
                <a className="underline underline-offset-4" href={'/majors/' + major.cip4 + '/statistics#careers'}>Related jobs</a>
                <a className="underline underline-offset-4" href={'/majors/' + major.cip4 + '/statistics#graduate-study'}>Grad school</a>
            </div>
        </section>
        <ReviewList reviews={reviewData.reviews} total={reviewData.total} page={reviewsPage} signedIn={Boolean(user)} buildHref={next => href(page, next, 'student-reviews')} scope="Across schools" />
        <section id="schools" className="scroll-mt-24 my-10">
            <h2 className="text-3xl font-bold mb-4">Find your school</h2>
            <p className="mb-5">Schools with catalog entries or published student reviews are listed alphabetically. Listings are not endorsements or confirmations of current admissions availability.</p>
            <form method="GET" className="flex flex-col sm:flex-row gap-3 mb-6">
                <label htmlFor="school-query" className="sr-only">School name</label>
                <SearchAutocomplete id="school-query" kind="schools" scope={major.cip4} defaultValue={query} placeholder="School name" />
                <button className="coffee-btn">Search</button>
            </form>
            {query && <a href={'/majors/' + major.cip4 + '#schools'} className="underline inline-block mb-4">Clear school search</a>}
            <p className="mb-4">{schoolCount} schools found</p>
            <div className="grid sm:grid-cols-2 gap-5">{schools.map(school => <a className="coffee-card" href={'/majors/' + major.cip4 + '/' + school.unitid} key={school.unitid}>
                <h3 className="font-bold text-xl mb-3">{school.name}</h3>
                <p>{school.city}, {school.state}</p>
                <p className="mt-3">{school._count.reviews} student {school._count.reviews === 1 ? 'review' : 'reviews'}</p>
                <p className="underline mt-3">Read reviews →</p>
            </a>)}</div>
            {!schools.length && <p className="coffee-card">No matching schools on this page. Our catalog may be missing your program. <a className="underline font-semibold" href={'/write-review?majorId=' + major.cip4}>Write a review and select your school</a>, or try another search.</p>}
            <Pagination currentPage={page} totalPages={Math.ceil(schoolCount / 12)} buildHref={next => href(next, reviewsPage, 'schools')} />
        </section>
    </div>;
}
