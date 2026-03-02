import { Major } from '@prisma/client';

interface StructuredMajorContentProps {
    major: Major & { outcomes?: any };
}

export default function StructuredMajorContent({ major }: StructuredMajorContentProps) {
    const outcomes = major.outcomes ? (typeof major.outcomes === 'string' ? JSON.parse(major.outcomes) : major.outcomes) : null;

    return (
        <div className="mt-20 space-y-16 border-t border-earth-sage/10 pt-16">
            <section>
                <h3 className="text-3xl font-funky text-foreground mb-6 italic">About {major.title}</h3>
                <p className="text-lg text-foreground/70 leading-relaxed max-w-4xl">
                    {major.description || `The ${major.title} program is designed to provide students with a comprehensive understanding of the field, combining theoretical foundations with practical applications. Students in this major develop a unique set of skills that prepare them for various challenges in the professional world.`}
                </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <section className="coffee-card bg-earth-parchment/50">
                    <h4 className="text-xl font-bold uppercase tracking-widest text-earth-sage mb-6">Skills You Gain</h4>
                    <ul className="space-y-4">
                        {['Critical Thinking', 'Analytical Reasoning', 'Problem Solving', 'Domain Expertise'].map((skill) => (
                            <li key={skill} className="flex items-center gap-3 text-foreground/80 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-earth-terracotta" />
                                {skill}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="coffee-card bg-earth-parchment/50">
                    <h4 className="text-xl font-bold uppercase tracking-widest text-earth-sage mb-6">Common Career Paths</h4>
                    <ul className="space-y-4">
                        {outcomes?.commonJobs?.map((job: string) => (
                            <li key={job} className="flex items-center gap-3 text-foreground/80 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-earth-mustard" />
                                {job}
                            </li>
                        )) || (
                                <li className="text-foreground/60 italic">Gathering career outcome data...</li>
                            )}
                    </ul>
                </section>
            </div>

            <section className="bg-earth-terracotta/5 rounded-3xl p-10 border border-earth-terracotta/10">
                <h4 className="text-2xl font-funky text-earth-terracotta mb-6 italic">Who This Is For</h4>
                <p className="text-lg text-foreground/70 leading-relaxed italic">
                    This path is ideal for individuals who are curious about the mechanics of our world, possess a strong desire to solve complex problems, and are looking to make a meaningful impact in their chosen industry through dedicated study and specialization.
                </p>
            </section>

            <section>
                <h4 className="text-2xl font-funky text-foreground mb-6 italic">ROI & Outcomes Summary</h4>
                <p className="text-lg text-foreground/70 leading-relaxed">
                    Graduates from {major.title} programs typically see a {outcomes?.salaryRange ? `competitive salary range starting from ${outcomes.salaryRange}` : 'solid return on investment'}, with strong placement rates in both traditional and emerging sectors. The versatility of the degree allows for significant career mobility and long-term earnings potential.
                </p>
            </section>
        </div>
    );
}
