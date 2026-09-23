import { Major } from '@prisma/client';

interface StructuredMajorContentProps {
    major: Major;
    occupations: { socCode: string; title: string }[];
}

export default function StructuredMajorContent({ major, occupations }: StructuredMajorContentProps) {
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
                    <h4 className="text-xl font-bold uppercase tracking-widest text-earth-sage mb-6">Related Occupations</h4>
                    <ul className="space-y-4">
                        {occupations.map((occupation) => (
                            <li key={occupation.socCode} className="flex items-center gap-3 text-foreground/80 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-earth-mustard" />
                                {occupation.title}
                            </li>
                        ))}
                        {occupations.length === 0 && <li className="text-foreground/60 italic">No official occupation matches are listed for this field.</li>}
                    </ul>
                    <p className="mt-6 text-xs text-foreground/60">Curriculum-to-occupation matches, not graduate placements. Some roles require further education or experience.</p>
                    <a className="inline-block mt-3 text-xs underline text-earth-sage" href="https://nces.ed.gov/ipeds/cipcode/Files/CIP2020_SOC2018_Crosswalk.xlsx" target="_blank" rel="noopener noreferrer">Source: NCES/BLS CIP–SOC crosswalk</a>
                </section>
            </div>

            <section className="bg-earth-terracotta/5 rounded-3xl p-10 border border-earth-terracotta/10">
                <h4 className="text-2xl font-funky text-earth-terracotta mb-6 italic">Who This Is For</h4>
                <p className="text-lg text-foreground/70 leading-relaxed italic">
                    This path is ideal for individuals who are curious about the mechanics of our world, possess a strong desire to solve complex problems, and are looking to make a meaningful impact in their chosen industry through dedicated study and specialization.
                </p>
            </section>

        </div>
    );
}
