import { parsePage, searchText } from '@/lib/navigation';
import { searchInstitutions } from '@/app/actions/search';
import Catalog from '@/components/Catalog';

export const metadata = { title: 'Student reviews by school | RateMyDegrees', description: 'Find degree reviews at a school. Schools are listed alphabetically, without rankings or endorsements.', alternates: { canonical: 'https://ratemydegrees.com/institutions' } };
export default async function InstitutionsPage({ searchParams }: { searchParams: { q?: string; state?: string; page?: string } }) {
    const query = searchText(searchParams.q), filter = searchText(searchParams.state).slice(0, 2).toUpperCase(), page = parsePage(searchParams.page);
    const result = await searchInstitutions(query, { page, ...(filter ? { filterBy: 'state:=' + filter } : {}) });
    return <Catalog kind="schools" query={query} filter={filter} page={page} {...result} items={result.hits.map(row => ({ id: row.id, name: row.name, context: [row.city, row.state].filter(Boolean).join(', '), reviewCount: row.reviewCount, href: '/institutions/' + row.unitid }))} />;
}
