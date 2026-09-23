import Pagination from './Pagination';
import { ArrowLeft, ArrowUpRight, BookOpen, School, MessageCircle, Search } from 'lucide-react';

interface CatalogProps {
    kind: 'degrees' | 'schools'; query: string; filter: string; page: number;
    totalPages: number; totalHits: number; unavailable: boolean;
    items: { id: string; name: string; context: string; reviewCount: number; href: string }[];
}
export default function Catalog({ kind, query, filter, page, totalPages, totalHits, unavailable, items }: CatalogProps) {
    const path = kind === 'degrees' ? '/majors' : '/institutions';
    const filterName = kind === 'degrees' ? 'category' : 'state';
    const href = (next: number) => { const params = new URLSearchParams({ page: String(next) }); if(query) params.set('q',query); if(filter) params.set(filterName,filter); return path+'?'+params.toString(); };
    return <div className="container mx-auto px-6 py-10 max-w-6xl">
        <a href="/" className="inline-flex items-center gap-2 text-sm underline underline-offset-4"><ArrowLeft size={16} aria-hidden="true" />Home</a>
        <div className="flex items-start gap-5 mt-8 mb-5">
            <span className="hidden sm:flex wavy-border bg-earth-mustard/25 p-4 -rotate-6 shrink-0" aria-hidden="true">{kind === 'degrees' ? <BookOpen size={32} strokeWidth={1.5} /> : <School size={32} strokeWidth={1.5} />}</span>
            <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-burgundy mb-3">Student voices, firsthand</p><h1 className="warm-display text-4xl sm:text-5xl font-bold">{kind === 'degrees' ? 'Find degree reviews' : 'Find reviews by school'}</h1></div>
        </div>
        <p className="mb-6 max-w-2xl leading-relaxed">Get a feel for the experience, in students’ own words. Browse alphabetically or search by name.</p>
        <nav aria-label="Browse reviews" className="flex flex-wrap gap-3 mb-6"><a href="/majors" aria-current={kind === 'degrees' ? 'page' : undefined} className="catalog-tab"><BookOpen size={17} aria-hidden="true" />Degrees</a><a href="/institutions" aria-current={kind === 'schools' ? 'page' : undefined} className="catalog-tab"><School size={17} aria-hidden="true" />Schools</a></nav>
        <form action={path} method="GET" className="coffee-card mb-8">
            <label htmlFor="catalog-query" className="block font-bold mb-2">{kind === 'degrees' ? 'Degree name' : 'School name or city'}</label>
            <div className="flex flex-col sm:flex-row gap-3"><input id="catalog-query" type="search" name="q" maxLength={200} defaultValue={query} placeholder={kind === 'degrees' ? 'e.g. Psychology' : 'e.g. University of Florida'} className="coffee-input min-w-0" /><button className="coffee-btn gap-2" type="submit"><Search size={19} aria-hidden="true" />Search</button></div>
            {kind === 'schools' && <div className="mt-4"><label htmlFor="school-state" className="block mb-2">State abbreviation (optional)</label><input id="school-state" name="state" defaultValue={filter} maxLength={2} placeholder="e.g. FL" className="coffee-input max-w-40 uppercase" /></div>}
            {kind === 'degrees' && filter && <p className="mt-3">Category: {filter}<input type="hidden" name="category" value={filter} /></p>}
            {(query || filter) && <a href={path} className="inline-block underline mt-4">Clear search and filters</a>}
        </form>
        {unavailable ? <p role="alert" className="coffee-card">Search is temporarily unavailable. Please try again.</p> : <>
            <div className="flex flex-wrap justify-between items-baseline gap-2 mb-5"><p role="status" className="font-semibold">{totalHits.toLocaleString('en-US')} {kind} found{page > 1 ? ' · Page ' + page : ''}</p><p className="text-sm text-foreground/75">Review counts reflect participation, not quality.</p></div>
            {!items.length ? <div className="coffee-card"><p>{totalHits ? 'There are no results on this page.' : 'No matches. Try another name or clear your filters.'}</p><a href={href(1)} className="underline inline-block mt-3">Go to the first page</a></div> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map(item => <a href={item.href} key={item.id} className="coffee-card review-catalog-card group flex flex-col gap-4 hover:border-earth-terracotta">
                    <h2 className="font-bold text-xl break-words">{item.name.replace(/[.\s]+$/, '')}</h2>
                    <p className="text-sm">{item.context}</p>
                    <p className="mt-auto font-semibold flex items-center gap-2"><MessageCircle size={18} className="text-earth-burgundy" aria-hidden="true" />{item.reviewCount} student {item.reviewCount === 1 ? 'review' : 'reviews'}</p>
                    <p className="text-sm border-t border-foreground/15 pt-4 flex justify-between items-center gap-3">{item.reviewCount ? 'Read their experiences' : 'No reviews yet · Take a look'}<ArrowUpRight size={20} className="shrink-0 text-earth-burgundy" aria-hidden="true" /></p>
                </a>)}
            </div>}
            <Pagination currentPage={page} totalPages={totalPages} buildHref={href} />
        </>}
    </div>;
}

