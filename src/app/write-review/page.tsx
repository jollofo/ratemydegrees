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
        <div className="container mx-auto px-6 py-10 max-w-4xl">
            <div className="mb-12 text-center">
                <h1 className="text-6xl font-funky text-foreground mb-6 tracking-tight italic">Share Your Experience</h1>
                <p className="text-xl text-earth-sage max-w-2xl mx-auto leading-relaxed italic opacity-80">
                    Help other students understand your academic journey. Focus on academic rigor, curriculum depth, and the faculty that shaped your program.
                </p>
            </div>

            <WriteReviewForm majors={majors} institutions={institutions} />
        </div>
    );
}
