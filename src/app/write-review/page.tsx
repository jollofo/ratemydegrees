import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getMajorsForSearch, getInstitutionsForSearch } from './actions';
import WriteReviewForm from './ReviewForm';

export default async function WriteReviewPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?next=/write-review');
    }

    const [majors, institutions] = await Promise.all([
        getMajorsForSearch(),
        getInstitutionsForSearch()
    ]);

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Rate Your Academic Program</h1>
                <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
                    Focus on your major-specific experience. Academic rigor, faculty, and outcomes.
                    <span className="block font-bold mt-2 text-primary-600 italic">No institution-wide complaints.</span>
                </p>
            </div>

            <WriteReviewForm majors={majors} institutions={institutions} />
        </div>
    );
}
