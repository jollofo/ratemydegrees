import { parsePage, searchText } from '@/lib/navigation';
import { searchMajors } from '@/app/actions/search';
import Catalog from '@/components/Catalog';

export const metadata = { title: 'Degree reviews | RateMyDegrees', description: 'Find real student degree reviews. Browse alphabetically or search by degree name.', alternates: { canonical: 'https://ratemydegrees.com/majors' } };
export default async function MajorsPage({ searchParams }: { searchParams: { q?: string; category?: string; page?: string } }) {
    const query = searchText(searchParams.q), filter = searchText(searchParams.category), page = parsePage(searchParams.page);
    const result = await searchMajors(query, { page, ...(filter ? { filterBy: 'category:=' + filter } : {}) });
    return <Catalog kind="degrees" query={query} filter={filter} page={page} {...result} items={result.hits.map(row => ({ id: row.id, name: row.title, context: '', reviewCount: row.reviewCount, href: '/majors/' + row.cip4 }))} />;
}
