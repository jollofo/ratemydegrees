import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProgramIndex from '@/components/ProgramIndex';
import { ArrowLeft } from 'lucide-react';

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
                orderBy: { completionsTotal: 'desc' }
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
        <div className="container mx-auto px-6 py-16 max-w-7xl">
            <a
                href="/institutions"
                className="inline-flex items-center text-sm font-bold text-earth-terracotta hover:underline mb-12"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Universities
            </a>

            <div className="mb-20 border-b-2 border-earth-sage/20 pb-16 flex flex-col md:flex-row md:items-end justify-between gap-12">
                <div className="max-w-4xl">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="bg-earth-sage/10 border border-earth-sage px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-earth-sage rounded-full">{institution.control}</span>
                        <span className="text-foreground font-bold uppercase tracking-widest text-[10px] opacity-60">{institution.city}, {institution.state}</span>
                    </div>
                    <h1 className="text-7xl font-funky text-foreground tracking-tight leading-[0.85]">{institution.name}</h1>
                </div>
                <div className="bg-earth-parchment border-2 border-foreground p-1.5 flex gap-1 rounded-full w-fit h-fit">
                    <div className="px-6 py-2.5 bg-foreground text-white rounded-full text-xs font-bold uppercase tracking-widest">Profiles</div>
                    <div className="px-6 py-2.5 text-foreground opacity-40 rounded-full text-xs font-bold uppercase tracking-widest cursor-not-allowed">Map</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
                <div className="lg:col-span-5 space-y-12">
                    <div className="coffee-card bg-earth-parchment/30">
                        <h3 className="text-2xl font-funky text-foreground mb-10 italic border-b border-foreground/5 pb-6">Campus Profile</h3>
                        <div className="space-y-8">
                            <div className="flex justify-between items-end border-b border-foreground/5 pb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-earth-sage italic">Student Reviews</span>
                                <span className="text-4xl font-funky text-foreground italic leading-none">{institution._count.reviews}</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-foreground/5 pb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-earth-sage italic">Affiliation</span>
                                <span className="text-sm font-bold text-foreground uppercase tracking-widest">{institution.control}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-earth-sage italic">Location</span>
                                <span className="text-sm font-bold text-foreground uppercase tracking-widest text-right">{institution.city}, {institution.state}</span>
                            </div>
                        </div>
                    </div>

                    <div className="coffee-card bg-earth-burgundy text-earth-parchment shadow-[6px_6px_0px_#433422]">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                        </div>
                        <h3 className="text-2xl font-funky mb-4 italic">Data Accuracy</h3>
                        <p className="text-sm font-medium leading-relaxed italic opacity-70">
                            The metrics shared for &quot;{institution.name}&quot; are verified with official outcomes and the latest academic taxonomy.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <ProgramIndex majors={uniqueMajors} unitid={institution.unitid} />
                </div>
            </div>
        </div>
    );
}
