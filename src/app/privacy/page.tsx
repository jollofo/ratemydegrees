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
                <p className="mb-6">At RateMyDegree, we take your privacy seriously. This policy outlines how we collect, use, and protect your information...</p>
                <h2 className="text-2xl font-funky text-foreground mt-12 mb-6">1. Information Collection</h2>
                <p className="mb-6">We collect information you provide directly to us, such as when you create an account, post a review, or communicate with us.</p>
                <h2 className="text-2xl font-funky text-foreground mt-12 mb-6">2. Use of Information</h2>
                <p className="mb-6">We use the information we collect to provide, maintain, and improve our services, and to communicate with you.</p>
                <p className="mt-20 text-sm opacity-50 italic">Last updated: February 11, 2026</p>
            </div>
        </div>
    );
}
