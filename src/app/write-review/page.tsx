import { createClient } from '@/utils/supabase/server';
import { redirectToLogin } from '@/lib/auth-redirect';
import prisma from '@/lib/prisma';
import { getMajorsForSearch, getInstitutionsForSearch } from './actions';
import WriteReviewForm from './ReviewForm';

export const metadata = { title: 'Write a degree review | RateMyDegrees', robots: { index: false, follow: true } };

export default async function WriteReviewPage({ searchParams }: { searchParams: { majorId?: string; institutionId?: string } }) {
    const { data: { user } } = await createClient().auth.getUser();
    const context = new URLSearchParams();
    if (searchParams.majorId) context.set('majorId', searchParams.majorId);
    if (searchParams.institutionId) context.set('institutionId', searchParams.institutionId);
    if (!user) redirectToLogin('/write-review' + (context.size ? '?' + context.toString() : ''));
    const [majors, institutions, major, institution] = await Promise.all([
        getMajorsForSearch(), getInstitutionsForSearch(),
        searchParams.majorId ? prisma.major.findUnique({ where: { cip4: searchParams.majorId }, select: { cip4: true, title: true, category: true } }) : null,
        searchParams.institutionId ? prisma.institution.findUnique({ where: { unitid: searchParams.institutionId, active: true }, select: { unitid: true, name: true, state: true, city: true } }) : null,
    ]);
    return <div className="container mx-auto px-6 py-10 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">Share your degree experience</h1>
        <p className="mb-8">Tell incoming students what studying your degree was like. Relevant praise and criticism are equally welcome.</p>
        <WriteReviewForm majors={majors} institutions={institutions} preSelectedMajor={major ?? undefined} preSelectedInstitution={institution ?? undefined} />
    </div>;
}
