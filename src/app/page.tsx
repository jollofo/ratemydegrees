import HomeSearch from '@/components/HomeSearch';

export default function Home() {
    return (
        <div className="relative isolate">
            {/* Hero Section */}
            <div className="px-6 py-24 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl text-balance">
                        Choose your major with <span className="text-primary-600">confidence</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        Real perspectives from students and alumni. Stop guessing and start knowing what it's actually like to study your degree.
                    </p>
                    <div className="mt-10">
                        <HomeSearch />
                    </div>
                </div>
            </div>

            {/* Stats / Features */}
            <div className="bg-white py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:max-w-none">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Built by students, for students</h2>
                            <p className="mt-4 text-lg leading-8 text-gray-600">
                                Everything you need to know about academic rigor, career preparedness, and ROI.
                            </p>
                        </div>
                        <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-3">
                            <div className="flex flex-col bg-gray-400/5 p-8">
                                <dt className="text-sm font-semibold leading-6 text-gray-600">Verified Majors</dt>
                                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">100+</dd>
                            </div>
                            <div className="flex flex-col bg-gray-400/5 p-8">
                                <dt className="text-sm font-semibold leading-6 text-gray-600">Student Reviews</dt>
                                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">1k+</dd>
                            </div>
                            <div className="flex flex-col bg-gray-400/5 p-8">
                                <dt className="text-sm font-semibold leading-6 text-gray-600">Helpful Rating</dt>
                                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">98%</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
