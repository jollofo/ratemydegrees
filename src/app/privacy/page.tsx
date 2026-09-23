import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | RateMyDegree',
    description: 'Our commitment to your privacy.',
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-6 py-20 max-w-4xl">
            <h1 className="text-5xl font-funky text-foreground mb-10">Privacy Policy</h1>
            <div className="prose prose-slate max-w-none text-foreground/70 font-medium leading-relaxed italic">
                <p className="mb-6">At RateMyDegree, we take your privacy seriously. This page describes information used by the review platform.</p>
                <h2 className="text-2xl font-funky text-foreground mt-12 mb-6">1. Information Collection</h2>
                <p className="mb-6">We collect information you provide directly to us, such as when you create an account, post a review, or communicate with us.</p>
                <h2 className="text-2xl font-funky text-foreground mt-12 mb-6">2. Use of Information</h2>
                <p className="mb-6">We use the information we collect to provide, maintain, and improve our services, and to communicate with you.</p>
                <h2 className="text-2xl font-bold mt-8 mb-4">Public reviews and account data</h2><p>Reviews display the degree, school, student status, review date, ratings, and your written responses. Account details are kept separate from the public review. Your writing may still identify you or others; avoid sharing personal information.</p><h2 className="text-2xl font-bold mt-8 mb-4">Managing your contribution</h2><p>Use My reviews to edit or remove your contributions from public view. Removal retains an internal record for moderation. Optional drafts are stored in your browser tab until cleared or the tab session ends.</p><h2 className="text-2xl font-bold mt-8 mb-4">Service providers and diagnostics</h2><p>The platform uses Supabase for authentication and storage, Google for sign-in and analytics, and Sentry for error monitoring. Degree search may use a search index; alternate-name searches can be logged to improve matching. These services process information required to provide their functions.</p><p className="mt-20 text-sm opacity-50 italic">Last updated: September 23, 2026</p>
            </div>
        </div>
    );
}
