import prisma from '@/lib/prisma';

export default async function MajorsPage({
    searchParams,
}: {
    searchParams: { q?: string; category?: string };
}) {
    const query = searchParams.q || '';
    const category = searchParams.category || '';

    const majors = await prisma.major.findMany({
        where: {
            AND: [
                query ? { name: { contains: query } } : {},
                category && category !== 'All Categories' ? { category: category } : {},
            ],
        },
        include: {
            _count: {
                select: { reviews: true },
            },
            reviews: {
                select: {
                    ratings: true,
                },
            },
        },
    });

    // Calculate stats for each major
    const majorsWithStats = majors.map((major) => {
        const reviews = major.reviews;
        const reviewCount = major._count.reviews;

        let avgRating = 0;
        let avgDifficulty = 0;

        if (reviewCount >= 5) {
            const totalRating = reviews.reduce((acc, rev) => {
                const ratings = JSON.parse(rev.ratings);
                return acc + (ratings.satisfaction || 0);
            }, 0);

            const totalDifficulty = reviews.reduce((acc, rev) => {
                const ratings = JSON.parse(rev.ratings);
                return acc + (ratings.difficulty || 0);
            }, 0);

            avgRating = Number((totalRating / reviewCount).toFixed(1));
            avgDifficulty = Number((totalDifficulty / reviewCount).toFixed(1));
        }

        return {
            ...major,
            reviewCount,
            rating: reviewCount >= 5 ? avgRating : 'N/A',
            difficulty: reviewCount >= 5 ? avgDifficulty : 'N/A',
        };
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {query ? `Search results for "${query}"` : 'Browse Majors'}
                    </h1>
                    <p className="text-gray-600 mt-1">Explore and compare degrees based on student experiences.</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Simple category filter (could be made more functional with a client component) */}
                    <select
                        className="border border-gray-200 rounded-lg px-4 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        defaultValue={category}
                    >
                        <option>All Categories</option>
                        <option>STEM</option>
                        <option>Social Sciences</option>
                        <option>Business</option>
                        <option>Health</option>
                        <option>Humanities</option>
                    </select>
                </div>
            </div>

            {majorsWithStats.length === 0 ? (
                <div className="py-20 text-center">
                    <div className="inline-block p-6 bg-gray-50 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">No majors found</h2>
                    <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {majorsWithStats.map((major) => (
                        <a
                            key={major.id}
                            href={`/majors/${major.id}`}
                            className="group block p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 rounded-md mb-2">
                                        {major.category}
                                    </span>
                                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                        {major.name}
                                    </h2>
                                </div>
                                <div
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg ${major.rating === 'N/A' ? 'bg-gray-50' : 'bg-yellow-50'
                                        }`}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill={major.rating === 'N/A' ? 'none' : '#EAB308'}
                                        stroke={major.rating === 'N/A' ? '#9CA3AF' : '#EAB308'}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    <span
                                        className={`text-sm font-bold ${major.rating === 'N/A' ? 'text-gray-400' : 'text-yellow-700'
                                            }`}
                                    >
                                        {major.rating}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                                        Difficulty
                                    </div>
                                    <div className="text-lg font-bold text-gray-900">{major.difficulty}</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                                        Reviews
                                    </div>
                                    <div className="text-lg font-bold text-gray-900">{major.reviewCount}</div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-center text-sm font-medium text-primary-600 group-hover:translate-x-1 transition-transform">
                                {major.reviewCount < 5 ? 'Be the first to review' : 'View Detailed Ratings'}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="ml-1"
                                >
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
