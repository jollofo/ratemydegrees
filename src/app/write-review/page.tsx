import { getMajorsForSearch } from './actions';
import WriteReviewForm from './ReviewForm';

export default async function WriteReviewPage() {
    const majors = await getMajorsForSearch();

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <div className="mb-12 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Share Your Experience</h1>
                <p className="text-gray-600">Your feedback helps thousands of students make better choices.</p>
            </div>

            <WriteReviewForm majors={majors} />
        </div>
    );
}
