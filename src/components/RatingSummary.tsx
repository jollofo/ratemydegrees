export default function RatingSummary({ averages }: { averages: { label: string; count: number; score: number | null }[] }) {
    return <section className="coffee-card mb-8" aria-labelledby="rating-summary">
        <h2 id="rating-summary" className="text-2xl font-bold mb-3">Student-reported ratings</h2>
        <p className="text-sm mb-5">An average appears after five valid answers in a category. Not-applicable answers are excluded. These reviews may not represent every student.</p>
        <dl className="grid sm:grid-cols-2 gap-5">{averages.map(item => <div key={item.label}>
            <dt className="font-bold">{item.label}</dt>
            <dd>{item.score === null ? 'Not enough ratings' : item.score + ' / 5'} <span className="text-sm">({item.count} {item.count === 1 ? 'answer' : 'answers'})</span></dd>
        </div>)}</dl>
        <a href="/guidelines" className="inline-block underline text-sm mt-5">How ratings and moderation work</a>
    </section>;
}
