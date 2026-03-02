import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | RateMyDegree',
    description: 'Please read our terms of service carefully.',
};

export default function TermsPage() {
    return (
        <div className="container mx-auto px-6 py-20 max-w-4xl">
            <h1 className="text-5xl font-funky text-foreground mb-10">Terms of Service</h1>
            <div className="prose prose-slate max-w-none text-foreground/70 font-medium leading-relaxed italic">
                <p className="mb-6">Welcome to RateMyDegree. By using our services, you agree to the following terms and conditions...</p>
                <h2 className="text-2xl font-funky text-foreground mt-12 mb-6">1. Acceptance of Terms</h2>
                <p className="mb-6">By accessing or using RateMyDegrees, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
                <h2 className="text-2xl font-funky text-foreground mt-12 mb-6">2. Use of Service</h2>
                <p className="mb-6">You agree to use the service only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the service.</p>
                <p className="mt-20 text-sm opacity-50 italic">Last updated: February 11, 2026</p>
            </div>
        </div>
    );
}
