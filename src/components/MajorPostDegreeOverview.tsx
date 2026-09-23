import type { GraduateProgram, ScorecardNationalEarnings } from '@prisma/client';
import { ArrowRight, BriefcaseBusiness, GraduationCap, TrendingUp } from 'lucide-react';

type GraduateProgramWithSchool = GraduateProgram & { institution: { name: string } };

interface MajorPostDegreeOverviewProps {
    cip4: string;
    nationalEarnings: ScorecardNationalEarnings | null;
    occupations: { socCode: string; title: string }[];
    graduatePrograms: GraduateProgramWithSchool[];
}

export default function MajorPostDegreeOverview({ cip4, nationalEarnings, occupations, graduatePrograms }: MajorPostDegreeOverviewProps) {
    const statisticsHref = `/majors/${cip4}/statistics`;
    const accessibleJobs = occupations.filter(occupation => !/teachers|research scientists|managers/i.test(occupation.title));
    const jobExamples = (accessibleJobs.length >= 2 ? accessibleJobs : occupations).slice(0, 2);

    return (
        <section id="after-degree" className="mb-20 scroll-mt-8" aria-labelledby="after-degree-heading">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-earth-terracotta mb-2">Explore your options</p>
                    <h2 id="after-degree-heading" className="text-3xl md:text-4xl font-funky text-foreground italic">After this degree</h2>
                </div>
                <a href={statisticsHref} className="inline-flex items-center gap-2 text-sm font-bold text-earth-sage hover:text-earth-terracotta">
                    Explore all statistics <ArrowRight className="h-4 w-4" />
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <article className="coffee-card !p-5 bg-earth-burgundy text-earth-parchment flex flex-col">
                    <div className="flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4 text-earth-mustard" /><h3 className="text-lg font-funky italic">Salary</h3></div>
                    {nationalEarnings ? (
                        <>
                            <p className="text-3xl font-funky text-earth-mustard">${nationalEarnings.medianEarnings4Yr.toLocaleString('en-US')}</p>
                            <p className="text-sm text-earth-parchment/80 mt-1">Median annual earnings, 4 years after a bachelor&apos;s degree</p>
                        </>
                    ) : <p className="text-sm text-earth-parchment/80">Published salary data is unavailable for this major.</p>}
                    <a href="https://collegescorecard.ed.gov/data/" target="_blank" rel="noopener noreferrer" className="text-xs underline text-earth-parchment/70 mt-auto pt-4">Source: College Scorecard</a>
                </article>

                <article className="coffee-card !p-5 bg-earth-parchment/50 flex flex-col">
                    <div className="flex items-center gap-2 mb-3"><BriefcaseBusiness className="h-4 w-4 text-earth-sage" /><h3 className="text-lg font-funky italic">Jobs</h3></div>
                    {occupations.length > 0 ? (
                        <>
                            <p className="text-sm font-bold text-foreground">{jobExamples.map(occupation => occupation.title).join(' · ')}</p>
                            <p className="text-xs text-foreground/60 mt-2">Examples of related careers; some need further training.</p>
                        </>
                    ) : <p className="text-sm text-foreground/70">Related career data is unavailable for this major.</p>}
                    <a href="https://nces.ed.gov/ipeds/cipcode/Files/CIP2020_SOC2018_Crosswalk.xlsx" target="_blank" rel="noopener noreferrer" className="text-xs underline text-earth-sage mt-auto pt-4">Source: NCES and BLS</a>
                </article>

                <article className="coffee-card !p-5 bg-earth-mustard/10 border-earth-mustard/20 flex flex-col">
                    <div className="flex items-center gap-2 mb-3"><GraduationCap className="h-4 w-4 text-earth-terracotta" /><h3 className="text-lg font-funky italic">Grad school</h3></div>
                    {graduatePrograms.length > 0 ? (
                        <>
                            <p className="text-sm font-bold text-foreground">{graduatePrograms[0].institution.name}</p>
                            <p className="text-xs text-foreground/60 mt-2">One school that awarded graduate degrees in this field in {graduatePrograms[0].sourceYear}.</p>
                        </>
                    ) : <p className="text-sm text-foreground/70">Graduate-program data is unavailable for this major.</p>}
                    <a href="https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx?rtid=1" target="_blank" rel="noopener noreferrer" className="text-xs underline text-earth-sage mt-auto pt-4">Source: IPEDS</a>
                </article>
            </div>
        </section>
    );
}
