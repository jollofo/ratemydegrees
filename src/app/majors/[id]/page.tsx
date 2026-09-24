import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { parsePage, searchText } from '@/lib/navigation';
import { getReviewPage } from '@/lib/review-data';
import ReviewList from '@/components/ReviewList';
import Pagination from '@/components/Pagination';
import Breadcrumbs from '@/components/Breadcrumbs';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import { searchDegreeSchools } from '@/lib/degree-school-search';
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
    const [reviewData, schoolData] = await Promise.all([
        getReviewPage({ cip4: major.cip4 }, user?.id, reviewsPage),
        searchDegreeSchools(major.cip4, query, page),
    ]);
    const { schools, total: schoolCount, totalPages } = schoolData;
    function href(schoolPage: number, reviewPage: number, anchor: string) {
        const queryParams = new URLSearchParams({ page: String(schoolPage), reviewsPage: String(reviewPage) });
        if(query) queryParams.set('q',query);
        return '/majors/' + major!.cip4 + '?' + queryParams.toString() + '#' + anchor;
    }
    return <div className="max-w-5xl mx-auto px-6 py-10">
        <Breadcrumbs items={[{ label: 'Degrees', href: '/majors' }, { label: major.title, href: '/majors/' + major.cip4 }]} />
        <h1 className="text-4xl sm:text-5xl font-bold break-words mb-4">{major.title.replace(/[.\s]+$/, '')}</h1>
        <a href={'/majors/' + major.cip4 + '/statistics'} className="inline-block font-semibold underline underline-offset-4 mb-6">View statistics &amp; opportunities</a>
        <div className="flex flex-wrap gap-5 items-center"><a href={'/write-review?majorId=' + major.cip4} className="coffee-btn">Write a review</a><a href="#schools" className="underline py-3">Find reviews at a school</a></div>
        <ReviewList reviews={reviewData.reviews} total={reviewData.total} page={reviewsPage} signedIn={Boolean(user)} buildHref={next => href(page, next, 'student-reviews')} scope="Across schools" />
        <section id="schools" className="scroll-mt-24 my-10">
            <h2 className="text-3xl font-bold mb-4">Find your school</h2>
            <p className="mb-5">Search for your school to read or write reviews. Schools with catalog entries or published reviews appear first; a missing catalog link won’t stop you from sharing your experience.</p>
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
                {!school.catalogListed && <p className="text-sm mt-3">This degree isn’t linked in our school catalog yet. If you studied it here, you can still write a review.</p>}
                <p className="mt-3">{school._count.reviews} student {school._count.reviews === 1 ? 'review' : 'reviews'}</p>
                <p className="underline mt-3">Read reviews →</p>
            </a>)}</div>
            {!schools.length && <p className="coffee-card">No matching schools on this page. Our catalog may be missing your program. <a className="underline font-semibold" href={'/write-review?majorId=' + major.cip4}>Write a review and select your school</a>, or try another search.</p>}
            <Pagination currentPage={page} totalPages={totalPages} buildHref={next => href(next, reviewsPage, 'schools')} />
        </section>
    </div>;
}
