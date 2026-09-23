import { redirect } from 'next/navigation';

export default function OpportunitiesRedirect({ params }: { params: { id: string } }) {
    redirect(`/majors/${params.id}/statistics`);
}
