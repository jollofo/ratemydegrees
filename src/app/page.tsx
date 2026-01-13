import HomeSearch from '@/components/HomeSearch';
import prisma from '@/lib/prisma';

export default async function Home() {
    const [majorCount, institutionCount] = await Promise.all([
        prisma.major.count(),
        prisma.institution.count({ where: { active: true } })
    ]);

    return (
        <div className="relative isolate overflow-hidden">
            {/* Hero Section */}
            <div className="relative px-6 py-32 sm:py-48 lg:px-8 bg-earth-parchment">
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="#8b9467" />
                    </svg>
                </div>

                <div className="relative z-10 mx-auto max-w-4xl text-center">
                    <h1 className="text-6xl font-funky tracking-tight text-foreground sm:text-8xl text-balance leading-[0.85] mb-12">
                        Find your <span className="text-earth-terracotta italic">best</span> academic path
                    </h1>
                    <p className="mt-8 text-xl leading-relaxed text-foreground/80 font-medium max-w-2xl mx-auto">
                        Honest, verified reviews from students and alumni. Real experiences to help you choose the right program.
                    </p>
                    <div className="mt-16">
                        <HomeSearch />
                    </div>
                </div>
            </div>

            {/* Stats / Features */}
            <div className="py-32 bg-[#fffefb] relative border-y-2 border-earth-sage/20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:max-w-none text-center">
                        <div className="mb-20">
                            <h2 className="text-5xl font-funky tracking-tight text-foreground mb-4">Real Reviews, Real Outcomes</h2>
                            <p className="text-lg font-medium text-earth-sage max-w-xl mx-auto italic">
                                Everything you need to know about academic rigor, career preparedness, and the value of your education.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:px-20">
                            <div className="coffee-card flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-earth-terracotta/10 rounded-full flex items-center justify-center text-earth-terracotta mb-6">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                </div>
                                <dt className="text-xs font-bold uppercase tracking-widest text-earth-sage mb-2">Programs Cataloged</dt>
                                <dd className="text-6xl font-funky tracking-tighter text-foreground italic leading-none">{majorCount}+</dd>
                            </div>
                            <div className="coffee-card flex flex-col items-center text-center shadow-[6px_6px_0px_#d4a017]">
                                <div className="w-16 h-16 bg-earth-mustard/10 rounded-full flex items-center justify-center text-earth-mustard mb-6">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8"><path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" /><path d="M5 21V10.85" /><path d="M19 21V10.85" /><path d="M9 21V14" /><path d="M15 21V14" /></svg>
                                </div>
                                <dt className="text-xs font-bold uppercase tracking-widest text-earth-sage mb-2">US Institutions</dt>
                                <dd className="text-6xl font-funky tracking-tighter text-foreground italic leading-none">{institutionCount.toLocaleString()}</dd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-40 bg-earth-terracotta text-white relative overflow-hidden">
                <div className="absolute right-[-10%] top-[-20%] w-[40%] aspect-square rounded-full bg-white/5 blur-3xl opacity-50" />
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h3 className="text-5xl font-funky tracking-tight italic mb-10 max-w-2xl mx-auto">Share your student experience</h3>
                    <p className="text-xl mb-12 opacity-90 max-w-lg mx-auto font-medium">Help future students make informed decisions by sharing your program experience.</p>
                    <a href="/write-review" className="coffee-btn bg-white text-earth-terracotta hover:bg-earth-parchment px-16 py-6 text-xl">
                        Write a Review
                    </a>
                </div>
            </div>
        </div>
    );
}
