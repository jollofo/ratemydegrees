import type { GraduateProgram, ScorecardNationalEarnings } from '@prisma/client';
import { ArrowDown, BriefcaseBusiness, GraduationCap, TrendingUp } from 'lucide-react';

type GraduateProgramWithSchool = GraduateProgram & { institution: { name: string } };

interface MajorPostDegreeOverviewProps {
    cip4: string;
    majorTitle: string;
    nationalEarnings: ScorecardNationalEarnings | null;
    occupations: { socCode: string; title: string }[];
    graduatePrograms: GraduateProgramWithSchool[];
}

function awardName(level: number) {
    if (level === 7) return 'Master’s';
    if (level === 17) return 'Research doctorate';
    if (level === 18) return 'Professional doctorate';
    return 'Other doctorate';
}

export default function MajorPostDegreeOverview({ cip4, majorTitle, nationalEarnings, occupations, graduatePrograms }: MajorPostDegreeOverviewProps) {
    return (
        <section id="after-degree" className="mb-24 scroll-mt-8" aria-labelledby="after-degree-heading">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-earth-terracotta mb-3">Plan your next step</p>
                    <h2 id="after-degree-heading" className="text-4xl md:text-5xl font-funky text-foreground italic">After this degree</h2>
                    <p className="text-foreground/70 mt-3 max-w-3xl">Explore published earnings, related careers, and graduate study for {majorTitle}. These are possibilities and past outcomes, not guarantees.</p>
                </div>
                <a href="#schools" className="text-sm font-bold text-earth-sage hover:text-earth-terracotta flex items-center gap-2 shrink-0">
                    Browse schools <ArrowDown className="h-4 w-4" />
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <article className="coffee-card bg-earth-burgundy text-earth-parchment flex flex-col">
                    <div className="flex items-center gap-3 mb-7">
                        <TrendingUp className="h-5 w-5 text-earth-mustard" />
                        <h3 className="text-xl font-funky italic">Earnings</h3>
                    </div>
                    {nationalEarnings ? (
                        <>
                            <p className="text-xs uppercase tracking-widest text-earth-parchment/70">U.S. bachelor&apos;s graduates</p>
                            <p className="text-5xl font-funky text-earth-mustard italic mt-3 mb-1">${nationalEarnings.medianEarnings4Yr.toLocaleString('en-US')}</p>
                            <p className="text-sm text-earth-parchment/80">Median annual earnings 4 years after completion</p>
                            {nationalEarnings.p25Earnings4Yr !== null && nationalEarnings.p75Earnings4Yr !== null && (
                                <p className="text-xs text-earth-parchment/70 mt-5">Middle half: ${nationalEarnings.p25Earnings4Yr.toLocaleString('en-US')}–${nationalEarnings.p75Earnings4Yr.toLocaleString('en-US')}</p>
                            )}
                            <p className="text-xs text-earth-parchment/60 mt-5">Among federally aided graduates who worked and were not enrolled in school.</p>
                            <a className="text-xs underline text-earth-parchment/80 hover:text-white mt-auto pt-6" href="https://collegescorecard.ed.gov/data/" target="_blank" rel="noopener noreferrer">College Scorecard · {nationalEarnings.sourceRelease}</a>
                        </>
                    ) : (
                        <p className="text-sm text-earth-parchment/70">Published national bachelor&apos;s earnings are unavailable for this major.</p>
                    )}
                </article>

                <article className="coffee-card bg-earth-parchment/50 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <BriefcaseBusiness className="h-5 w-5 text-earth-sage" />
                        <h3 className="text-xl font-funky text-foreground italic">Related careers</h3>
                    </div>
                    {occupations.length > 0 ? (
                        <ul className="space-y-3">
                            {occupations.slice(0, 6).map(occupation => (
                                <li key={occupation.socCode} className="text-sm font-medium text-foreground/85 border-b border-earth-sage/10 pb-2 last:border-0">{occupation.title}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-foreground/60">No official occupation matches are listed for this field.</p>
                    )}
                    <p className="text-xs text-foreground/60 mt-5">Curriculum matches, not graduate placements. Some roles need further education or experience.</p>
                    {occupations.length > 6 && <a className="text-sm font-bold text-earth-sage hover:text-earth-terracotta mt-4" href={`/majors/${cip4}/opportunities#careers`}>See all related careers →</a>}
                    <a className="text-xs underline text-earth-sage mt-auto pt-6" href="https://nces.ed.gov/ipeds/cipcode/Files/CIP2020_SOC2018_Crosswalk.xlsx" target="_blank" rel="noopener noreferrer">Source: NCES/BLS CIP–SOC crosswalk</a>
                </article>

                <article className="coffee-card bg-earth-mustard/10 border-earth-mustard/20 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <GraduationCap className="h-5 w-5 text-earth-terracotta" />
                        <h3 className="text-xl font-funky text-foreground italic">Graduate study</h3>
                    </div>
                    {graduatePrograms.length > 0 ? (
                        <>
                            <p className="text-xs text-foreground/60 mb-4">Examples of schools awarding graduate degrees in this field in {graduatePrograms[0].sourceYear}:</p>
                            <ul className="space-y-4">
                                {graduatePrograms.slice(0, 4).map(program => (
                                    <li key={`${program.unitid}-${program.awardLevel}`}>
                                        <a href={`/institutions/${program.unitid}`} className="block text-sm font-bold text-foreground hover:text-earth-terracotta">{program.institution.name}</a>
                                        <span className="text-xs text-earth-sage">{awardName(program.awardLevel)} · {program.completionsTotal.toLocaleString('en-US')} awarded</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <p className="text-sm text-foreground/60">No graduate awards were reported for this field in the available data.</p>
                    )}
                    <p className="text-xs text-foreground/60 mt-5">Past awards indicate program activity, not current admission availability.</p>
                    {graduatePrograms.length > 4 && <a className="text-sm font-bold text-earth-sage hover:text-earth-terracotta mt-4" href={`/majors/${cip4}/opportunities#graduate-study`}>See more graduate programs →</a>}
                    <a className="text-xs underline text-earth-sage mt-auto pt-6" href="https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx?rtid=1" target="_blank" rel="noopener noreferrer">Source: IPEDS 2024 Completions</a>
                </article>
            </div>
        </section>
    );
}
