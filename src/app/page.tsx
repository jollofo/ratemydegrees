import HomeSearch from '@/components/HomeSearch';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'RateMyDegrees | Real student degree reviews',
    description: 'Read firsthand degree experiences from students and graduates, or share your own. Find reviews by degree and school.',
    alternates: { canonical: 'https://ratemydegrees.com' },
};

export default function Home() {
    return <div>
        <section className="px-6 py-12 sm:py-20 max-w-5xl mx-auto text-center">
            <p className="font-bold text-sm uppercase tracking-widest text-earth-burgundy mb-5">Student degree reviews</p>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">Real students.<br /><span className="text-earth-burgundy">Real degree experiences.</span></h1>
            <p className="text-lg leading-relaxed max-w-2xl mx-auto mb-8">Read what students and graduates say about their degree - or share your own experience.</p>
            <HomeSearch />
            <div className="flex flex-wrap justify-center gap-6 mt-6">
                <a href="/majors" className="underline py-2 font-bold">Browse degrees</a>
                <a href="/institutions" className="underline py-2 font-bold">Browse schools</a>
                <a href="/write-review" className="underline py-2 font-bold">Write a review</a>
            </div>
        </section>
        <section aria-labelledby="about-reviews" className="max-w-6xl mx-auto px-6 py-10">
            <h2 id="about-reviews" className="text-3xl font-bold mb-8 text-center">A place for firsthand experiences</h2>
            <div className="grid md:grid-cols-3 gap-6">
                <article className="coffee-card"><h3 className="font-bold text-xl mb-3">What studying was like</h3><p>Read about coursework, teaching, workload, and support in students’ own words.</p></article>
                <article className="coffee-card"><h3 className="font-bold text-xl mb-3">Learn from student experiences</h3><p>Explore what students enjoyed, what challenged them, and what they wish they had known.</p></article>
                <article className="coffee-card"><h3 className="font-bold text-xl mb-3">The same rules for everyone</h3><p>Relevant praise and criticism are welcome.</p><a href="/guidelines" className="inline-block underline mt-4">How reviews work</a></article>
            </div>
        </section>
        <section className="text-center max-w-3xl mx-auto px-6 py-12">
            <h2 className="text-3xl font-bold mb-4">Share your degree experience</h2>
            <p className="mb-6">Your perspective can help incoming students understand what studying the degree was like. Your account details are not displayed with your review.</p>
            <a href="/write-review" className="coffee-btn">Write a review</a>
        </section>
    </div>;
}
