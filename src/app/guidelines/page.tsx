export const metadata = { title: 'How reviews work | RateMyDegrees' };
export default function Guidelines() {
    return <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-4xl font-bold">How reviews work</h1>
        <p>RateMyDegrees hosts firsthand degree experiences from students and graduates. Reviews are personal accounts, not platform endorsements or verified statements about a school.</p>
        <h2 className="text-2xl font-bold">The same rules for every school</h2>
        <p>Relevant praise and criticism are equally welcome. Describe your own coursework, workload, teaching, support, and degree experience. A negative opinion alone is not a reason to remove a review.</p>
        <h2 className="text-2xl font-bold">Respect privacy and stay relevant</h2>
        <p>Do not include names or contact details that identify other people, threats, harassment, impersonation, spam, or unrelated content. Describe events and your perspective without personal attacks.</p>
        <h2 className="text-2xl font-bold">Anonymous public display</h2>
        <p>Your account details are not shown with your review. Your school, degree, student status, review date, and written experience are public. Your own text may identify you, so check it before submitting. Sign-in does not verify attendance.</p>
        <h2 className="text-2xl font-bold">Moderation and reports</h2>
        <p>Automated checks may queue possible contact information or links for moderation. Edited reviews return to moderation. Reports enter a separate queue and do not automatically hide a review. Moderators apply these content rules regardless of school or sentiment.</p>
        <h2 className="text-2xl font-bold">Understanding ratings</h2>
        <p>Ratings reflect the contributors who chose to review. An average appears after five valid answers for that category; this is not a guarantee of a representative sample. Not-applicable answers are excluded. Review counts measure participation, not degree quality. Helpful votes are reader feedback, not verification.</p>
        <p>Schools and degrees are browsed alphabetically. There are no platform rankings or recommendations. Reviews are shown newest first.</p>
        <a href="/write-review" className="coffee-btn">Write a review</a>
    </div>;
}
