import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const institution = await prisma.institution.findUnique({ where: { unitid: params.id } });
    return {
        title: `${institution?.name || 'Institution'} | Academic Programs`,
        description: `Academic programs and student outcomes context for ${institution?.name}. Focus on department-level quality.`,
    };
}

export default async function InstitutionPage({ params }: { params: { id: string } }) {
    const institution = await prisma.institution.findUnique({
        where: { unitid: params.id },
        include: {
            offeredMajors: {
                include: {
                    major: true
                },
                orderBy: { completionsTotal: 'desc' },
                take: 50
            },
            _count: {
                select: { reviews: { where: { status: 'APPROVED' } } }
            }
        }
    });

    if (!institution) {
        notFound();
    }

    const uniqueMajors = institution.offeredMajors.map(om => ({
        id: om.major.cip4,
        name: om.major.title,
        category: om.major.category,
        reviewCount: 0,
        completions: om.completionsTotal
    }));

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">{institution.state} &bull; {institution.control}</span>
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 tracking-tight">{institution.name}</h1>
                        <p className="mt-4 text-lg text-gray-500 max-w-2xl leading-relaxed font-medium">
                            An overview of academic programs and verified student outcomes for {institution.name} in {institution.city}, {institution.state}.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
                <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Institutional Profile</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm font-medium">Control</span>
                            <span className="text-gray-900 font-bold">{institution.control}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500 text-sm font-medium">Sector</span>
                            <span className="text-gray-900 font-bold">{institution.sector}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500 text-sm font-medium">UNITID</span>
                            <span className="text-gray-900 font-bold text-right text-xs leading-tight">
                                {institution.unitid}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-primary-900 text-white rounded-[32px] p-10 relative overflow-hidden">
                    <div className="relative z-10 max-w-xl">
                        <h3 className="text-2xl font-black mb-4">Academic Experience Focus</h3>
                        <p className="text-primary-100 font-medium leading-relaxed">
                            We focus exclusively on program-level data to help you understand the quality of specific departments.
                            Aggregated ratings are calculated based on curriculum, faculty, and outcomes rather than institution-wide policies.
                        </p>
                    </div>
                    {/* Subtle decorative element */}
                    <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary-800 rounded-full blur-3xl opacity-50 transition-all group-hover:scale-110"></div>
                </div>
            </div>

            <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-black text-gray-900">Program Index</h2>
                    <span className="text-gray-400 text-sm font-medium">{uniqueMajors.length} Academic Programs Offered</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {uniqueMajors.length > 0 ? (uniqueMajors.map((major) => (
                        <a
                            key={major.id}
                            href={`/majors/${major.id}/${institution.unitid}`}
                            className="group bg-white border border-gray-100 p-8 rounded-[32px] hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-100 transition-all"
                        >
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{major.category}</span>
                            <h4 className="text-xl font-black text-gray-900 group-hover:text-primary-600 transition-colors leading-tight mb-4">{major.name}</h4>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 group-hover:border-primary-50 transition-colors">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{major.completions} Grads/Year</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-400 transition-transform group-hover:translate-x-1"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </div>
                        </a>
                    ))) : (
                        <div className="col-span-full py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 text-center">
                            <p className="text-gray-400 font-bold mb-4">No academic experiences logged for this institution yet.</p>
                            <a href="/write-review" className="bg-primary-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary-200 inline-block hover:-translate-y-1 transition-transform">
                                Start the first review
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
