import type { ReviewRatings } from '@/app/write-review/types';

export interface RatingCategory { key: keyof ReviewRatings; label: string; subtitle: string; icon: string; scoreDescriptions: Record<number, string>; }

// Preserve existing rating meanings; changing these requires an explicit version/migration.
export const ratingCategories: RatingCategory[] = [
        {
            key: 'rigor',
            label: 'Academic Rigor',
            subtitle: 'Depth and intellectual challenge of coursework',
            icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
            scoreDescriptions: {
                1: 'Superficial content with little intellectual challenge',
                2: 'Below average depth; mostly surface-level material',
                3: 'Moderate rigor with some challenging courses',
                4: 'Strong depth; demanding coursework and rigorous grading',
                5: 'Exceptional — graduate-level thinking expected throughout',
            },
        },
        {
            key: 'flexibility',
            label: 'Curriculum Relevance',
            subtitle: 'How well courses reflect current real-world needs',
            icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
            scoreDescriptions: {
                1: 'Outdated — content feels disconnected from the industry',
                2: 'Mostly outdated material with a few relevant topics',
                3: 'A mix of current and legacy content',
                4: 'Largely current; regularly updated to match industry trends',
                5: 'Cutting-edge — curriculum mirrors what employers want today',
            },
        },
        {
            key: 'value',
            label: 'Faculty Accessibility',
            subtitle: 'How approachable and supportive professors are',
            icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            scoreDescriptions: {
                1: 'Professors rarely available; little to no student support',
                2: 'Hard to reach; office hours often cancelled',
                3: 'Reasonably accessible during scheduled times',
                4: 'Responsive and supportive; mentoring relationships common',
                5: 'Exceptional access — professors invest deeply in students',
            },
        },
        {
            key: 'difficulty',
            label: 'Workload vs. Payoff',
            subtitle: 'Whether the effort required was worth the reward',
            icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
            scoreDescriptions: {
                1: 'Heavy workload with little practical or career return',
                2: "Effort often felt wasted; outcomes didn’t justify the grind",
                3: 'Balanced overall; some courses felt worth it',
                4: 'Challenging but clearly valuable for career and skills',
                5: 'Every demanding moment paid off — well worth the effort',
            },
        },
        {
            key: 'career',
            label: 'Career Preparedness',
            subtitle: 'How ready the program leaves you for the job market',
            icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            scoreDescriptions: {
                1: 'No career resources; program ignores professional development',
                2: 'Minimal support; students largely on their own',
                3: 'Some career services and industry exposure',
                4: 'Strong career pipeline; recruiters actively recruit here',
                5: 'Graduates are highly sought-after; job offers before graduation common',
            },
        },
        {
            key: 'networking',
            label: 'Networking Opportunities',
            subtitle: 'Quality of alumni network, events, and peer connections',
            icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
            scoreDescriptions: {
                1: 'No networking culture; alumni are disconnected',
                2: 'Occasional events but little lasting connection',
                3: 'Decent alumni network; some useful industry contacts',
                4: 'Active community with frequent industry events and alumni engagement',
                5: 'Outstanding network — alumni are well-connected and actively helpful',
            },
        },
        {
            key: 'research',
            label: 'Research Access',
            subtitle: 'Opportunities to engage in research or independent study',
            icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
            scoreDescriptions: {
                1: 'Research not accessible to undergrads; zero lab or project opportunities',
                2: 'Very limited — research reserved for top students only',
                3: 'Some research options exist but require effort to find',
                4: 'Good access to labs, faculty projects, and independent study',
                5: 'Abundant — undergrads routinely co-author papers and lead projects',
            },
        },
        {
            key: 'internships',
            label: 'Internship Support',
            subtitle: "Program’s help securing internships and co-ops",
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
            scoreDescriptions: {
                1: 'No institutional support; students find internships entirely alone',
                2: 'Token career fairs with little real employer interest',
                3: 'Moderate support — career office helps but selectivity varies',
                4: 'Strong partnerships with employers; many students land competitive internships',
                5: 'Excellent pipelines — top companies actively recruit and hire here',
            },
        },
        {
            key: 'satisfaction',
            label: 'Overall Satisfaction',
            subtitle: 'Would you choose this program again?',
            icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            scoreDescriptions: {
                1: 'Deeply regret the choice — would not recommend to anyone',
                2: 'More disappointments than highlights',
                3: 'Mixed feelings — had some good moments but many frustrations',
                4: 'Glad I chose it; would likely choose it again',
                5: "Couldn’t have made a better choice — would repeat in a heartbeat",
            },
        },
    ];
