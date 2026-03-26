import { createClient } from '@/utils/supabase/server';
import { redirectToLogin } from '@/lib/auth-redirect';
import { getMajorsForSearch, getInstitutionsForSearch } from './actions';
import WriteReviewForm from './ReviewForm';

export default async function WriteReviewPage({
    searchParams
}: {
    searchParams: { majorId?: string; institutionId?: string }
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirectToLogin('/write-review');
    }

    const [majors, institutions] = await Promise.all([
        getMajorsForSearch(),
        getInstitutionsForSearch()
    ]);

    // Find pre-selected items if IDs are provided
    const preSelectedMajor = searchParams.majorId
        ? majors.find(m => m.cip4 === searchParams.majorId)
        : undefined;
    const preSelectedInstitution = searchParams.institutionId
        ? institutions.find(i => i.unitid === searchParams.institutionId)
        : undefined;

    return (
        <div className="container mx-auto px-6 py-8 max-w-3xl">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-funky text-foreground mb-4 tracking-tight italic">Write a Review</h1>
                <p className="text-lg text-earth-sage max-w-2xl mx-auto leading-relaxed italic opacity-80">
                    Help other students understand your academic experience. Focus on academic rigor, curriculum depth, and the faculty that shaped your program.
                </p>
            </div>

            <WriteReviewForm
                majors={majors}
                institutions={institutions}
                preSelectedMajor={preSelectedMajor}
                preSelectedInstitution={preSelectedInstitution}
            />
        </div>
    );
}
