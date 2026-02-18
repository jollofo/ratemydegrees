import HomeSearch from '@/components/HomeSearch';
import { getHomepageStats } from '@/lib/stats';

export default async function Home() {
    const { majorCount, institutionCount } = await getHomepageStats();

    return (
        <div className="relative isolate overflow-hidden">
            {/* Hero Section */}
            <div className="relative px-6 py-20 sm:py-28 lg:px-8 bg-earth-parchment">
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="#8b9467" />
                    </svg>
                </div>

                <div className="relative z-10 mx-auto max-w-4xl text-center">
                    <h1 className="text-6xl font-funky tracking-tight text-foreground sm:text-8xl text-balance leading-[0.85] mb-12">
                        College Major Reviews: <span className="text-earth-terracotta italic">Find Your Best</span> Academic Program
                    </h1>
                    <p className="mt-8 text-xl leading-relaxed text-foreground/80 font-medium max-w-3xl mx-auto italic">
                        Honest, verified reviews from students and alumni. Real college major reviews to help you choose the right program and career across {institutionCount} US institutions.
                    </p>
                    <div className="mt-16">
                        <HomeSearch />
                    </div>
                </div>
            </div>

            {/* Stats / Features */}
            <div className="py-20 bg-[#fffefb] relative border-y-2 border-earth-sage/20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:max-w-none text-center">
                        <div className="mb-12">
                            <h2 className="text-5xl font-funky tracking-tight text-foreground mb-4">Real College Major Reviews &amp; Outcomes</h2>
                            <p className="text-lg font-medium text-earth-sage max-w-2xl mx-auto italic">
                                Everything you need to know about academic rigor, career preparedness, and the value of your education.
                                <br />
                                <span className="text-sm mt-4 block">
                                    Browse our collected <a href="/majors?category=STEM" className="text-earth-terracotta hover:underline font-bold">STEM Reviews</a>,
                                    {" "}<a href="/majors?category=Humanities" className="text-earth-terracotta hover:underline font-bold">Humanities Insights</a>,
                                    and <a href="/majors?category=Business" className="text-earth-terracotta hover:underline font-bold">Business Outcomes</a>.
                                </span>
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:px-20">
                            <a href="/majors" className="coffee-card flex flex-col items-center text-center group hover:shadow-[12px_12px_0px_#8b9467] transition-all">
                                <span className="absolute -top-3 right-8 bg-earth-sage text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">+12% This Month</span>
                                <div className="w-16 h-16 bg-earth-terracotta/10 rounded-full flex items-center justify-center text-earth-terracotta mb-6 group-hover:scale-110 transition-transform">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                </div>
                                <dt className="text-xs font-bold uppercase tracking-widest text-earth-sage mb-2">Browse all programs</dt>
                                <dd className="text-6xl font-funky tracking-tighter text-foreground italic leading-none mb-4">{majorCount}+</dd>
                                <div className="w-full bg-earth-sage/10 h-1.5 rounded-full overflow-hidden mt-4">
                                    <div className="bg-earth-sage h-full w-[65%] rounded-full opacity-60" />
                                </div>
                                <p className="text-[10px] font-bold text-earth-sage uppercase tracking-widest mt-3 opacity-40 italic underline group-hover:text-earth-terracotta">Explore the Catalog &rarr;</p>
                            </a>
                            <a href="/institutions" className="coffee-card flex flex-col items-center text-center shadow-[6px_6px_0px_#d4a017] group hover:shadow-[12px_12px_0px_#d4a017] transition-all">
                                <span className="absolute -top-3 right-8 bg-earth-mustard text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Across All 50 States</span>
                                <div className="w-16 h-16 bg-earth-mustard/10 rounded-full flex items-center justify-center text-earth-mustard mb-6 group-hover:scale-110 transition-transform">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8"><path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" /><path d="M5 21V10.85" /><path d="M19 21V10.85" /><path d="M9 21V14" /><path d="M15 21V14" /></svg>
                                </div>
                                <dt className="text-xs font-bold uppercase tracking-widest text-earth-sage mb-2">US Institutions</dt>
                                <dd className="text-6xl font-funky tracking-tighter text-foreground italic leading-none mb-4">{institutionCount.toLocaleString()}</dd>
                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100 italic">Top Outcomes</span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 italic">Avg $72k Salary</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Value Prop & Verification Section */}
            <div className="py-24 bg-white relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-earth-terracotta">
                                <div className="w-10 h-10 bg-earth-terracotta/10 rounded-xl flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>
                                <h3 className="text-xl font-funky italic tracking-tight">How we verify reviews</h3>
                            </div>
                            <p className="text-sm text-foreground/60 leading-relaxed italic">
                                Every review is matched against institutional enrollment patterns and alumni records. We filter for authenticity to ensure you get the real story.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-earth-parchment px-3 py-1 rounded-full border border-earth-sage/10 text-earth-sage italic">ID Verification</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-earth-parchment px-3 py-1 rounded-full border border-earth-sage/10 text-earth-sage italic">Pattern Analysis</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-earth-sage">
                                <div className="w-10 h-10 bg-earth-sage/10 rounded-xl flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                </div>
                                <h3 className="text-xl font-funky italic tracking-tight">What you&apos;ll learn</h3>
                            </div>
                            <p className="text-sm text-foreground/60 leading-relaxed italic">
                                Go beyond the brochure. Discover actual workload hours, program cost-to-value ratios, career impacts, and faculty accessibility.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-earth-parchment px-3 py-1 rounded-full border border-earth-sage/10 text-earth-sage italic">Program Rigor</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-earth-parchment px-3 py-1 rounded-full border border-earth-sage/10 text-earth-sage italic">ROI Focus</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-earth-mustard">
                                <div className="w-10 h-10 bg-earth-mustard/10 rounded-xl flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /><circle cx="12" cy="12" r="4" /></svg>
                                </div>
                                <h3 className="text-xl font-funky italic tracking-tight">Popular Insights</h3>
                            </div>
                            <div className="bg-earth-parchment/30 p-4 rounded-2xl border border-dashed border-earth-sage/20">
                                <p className="text-[11px] font-medium text-foreground/70 italic leading-relaxed">
                                    &quot;Programs with high faculty accessibility ratings average 4.8/5 across 12 institutions.&quot;
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-24 bg-earth-terracotta text-white relative overflow-hidden">
                <div className="absolute right-[-10%] top-[-20%] w-[40%] aspect-square rounded-full bg-white/5 blur-3xl opacity-50" />
                <div className="container mx-auto px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm border border-white/20">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-earth-terracotta bg-earth-parchment flex items-center justify-center text-[8px] font-bold text-earth-terracotta">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest">+8 reviews written today</p>
                    </div>

                    <h3 className="text-5xl font-funky tracking-tight italic mb-8 max-w-2xl mx-auto leading-tight">Write a Review. Help the Next Student.</h3>
                    <p className="text-xl mb-12 opacity-90 max-w-lg mx-auto font-medium italic">Help future students make informed decisions by sharing your experience.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <span className="text-2xl mb-4 block">📍</span>
                            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-white/60 italic">Step 1</p>
                            <p className="font-funky text-lg italic">Select Program</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <span className="text-2xl mb-4 block">⭐</span>
                            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-white/60 italic">Step 2</p>
                            <p className="font-funky text-lg italic">Rate Experience</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <span className="text-2xl mb-4 block">📝</span>
                            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-white/60 italic">Step 3</p>
                            <p className="font-funky text-lg italic">Help Others</p>
                        </div>
                    </div>

                    <a href="/write-review" className="coffee-btn bg-white text-earth-terracotta hover:bg-earth-parchment px-16 py-6 text-xl shadow-[0px_20px_40px_rgba(0,0,0,0.2)]">
                        Write a Review &rarr;
                    </a>
                </div>
            </div>
        </div>
    );
}
