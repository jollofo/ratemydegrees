import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { parsePage } from '@/lib/navigation';
import { getReviewPage } from '@/lib/review-data';
import ReviewList from '@/components/ReviewList';
import RatingSummary from '@/components/RatingSummary';
import Breadcrumbs from '@/components/Breadcrumbs';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string; institutionId: string } }): Promise<Metadata> {
    const [major, institution] = await Promise.all([prisma.major.findUnique({ where: { cip4: params.id }, select: { title: true } }), prisma.institution.findUnique({ where: { unitid: params.institutionId }, select: { name: true } })]);
    return { title: (major?.title ?? 'Degree') + ' at ' + (institution?.name ?? 'School') + ' | Student reviews', description: 'Read firsthand degree experiences from students and graduates.', alternates: { canonical: 'https://ratemydegrees.com/majors/' + params.id + '/' + params.institutionId } };
}
export default async function ProgramPage({ params, searchParams }: { params: { id: string; institutionId: string }; searchParams: { page?: string } }) {
    const [major, institution, offering] = await Promise.all([
        prisma.major.findUnique({ where: { cip4: params.id }, select: { cip4: true, title: true } }),
        prisma.institution.findUnique({ where: { unitid: params.institutionId }, select: { unitid: true, name: true, city: true, state: true } }),
        prisma.institutionMajor.findUnique({ where: { unitid_cip4: { unitid: params.institutionId, cip4: params.id } }, select: { unitid: true } }),
    ]);
    if (!major || !institution) notFound();
    const { data: { user } } = await createClient().auth.getUser();
    const page = parsePage(searchParams.page);
    const [data, earnings] = await Promise.all([
        getReviewPage({ cip4: params.id, unitid: params.institutionId }, user?.id, page),
        prisma.scorecardProgramEarnings.findUnique({ where: { unitid_cip4_credentialLevel: { unitid: params.institutionId, cip4: params.id, credentialLevel: 3 } } }),
    ]);
    const published = earnings?.medianEarnings4Yr ?? earnings?.medianEarnings5Yr ?? earnings?.medianEarnings1Yr;
    const years = earnings?.medianEarnings4Yr != null ? 4 : earnings?.medianEarnings5Yr != null ? 5 : 1;
    return <div className="max-w-5xl mx-auto px-6 py-10">
        <Breadcrumbs items={[{ label: 'Schools', href: '/institutions' }, { label: institution.name, href: '/institutions/' + institution.unitid }, { label: major.title, href: '/majors/' + major.cip4 + '/' + institution.unitid }]} />
        <h1 className="text-3xl sm:text-5xl font-bold break-words leading-tight mb-4">{major.title.replace(/[.\s]+$/, '')} at {institution.name}</h1>
        <p className="mb-6">{institution.city}, {institution.state} · Student degree reviews</p>
        {!offering && <p className="coffee-card mb-6">Our catalog hasn’t linked this degree to this school yet. If you studied it here, you can still share your experience.</p>}
        <a href={'/write-review?majorId=' + major.cip4 + '&institutionId=' + institution.unitid} className="coffee-btn mb-8">Write a review</a>
        <RatingSummary averages={data.averages} />
        <ReviewList reviews={data.reviews} total={data.total} page={page} signedIn={Boolean(user)} buildHref={next => '/majors/' + major.cip4 + '/' + institution.unitid + '?page=' + next + '#student-reviews'} scope={institution.name} />
        {earnings && published != null && <details className="border-t py-6">
            <summary className="cursor-pointer">Supplementary published graduate earnings</summary>
            <p className="mt-3">${published.toLocaleString('en-US')} median annual earnings, {years} {years === 1 ? 'year' : 'years'} after a bachelor’s degree.</p>
            <p className="text-sm my-3">College Scorecard release {earnings.sourceRelease}. Federally aided graduates who worked and were not enrolled. This is separate from student reviews and is not a recommendation.</p>
            <a href="https://collegescorecard.ed.gov/data/" className="underline" target="_blank" rel="noopener noreferrer">Source: College Scorecard</a>
        </details>}
        <a href="/guidelines" className="underline">Review guidelines apply equally to every school</a>
    </div>;
}
