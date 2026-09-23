'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from '@/app/actions/auth';
import { BookOpen, School, PencilLine, UserRound, MessageSquareText, ShieldCheck, Menu, X } from 'lucide-react';

export default function SiteNavigation({ signedIn, admin }: { signedIn: boolean; admin: boolean }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const links = [{ href: '/majors', label: 'Degrees', icon: BookOpen }, { href: '/institutions', label: 'Schools', icon: School }, { href: '/write-review', label: 'Write a review', icon: PencilLine }, ...(signedIn ? [{ href: '/my-reviews', label: 'My reviews', icon: MessageSquareText }] : [{ href: '/login', label: 'Sign in', icon: UserRound }]), ...(admin ? [{ href: '/admin/moderation', label: 'Moderation', icon: ShieldCheck }] : [])];
    return <>
        <button type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)} className="lg:hidden wavy-border bg-earth-mustard/25 w-12 h-12 shrink-0 flex items-center justify-center shadow-[2px_3px_0px_#433422] hover:bg-earth-mustard/40 transition-colors">{open ? <X aria-hidden="true" size={23} /> : <Menu aria-hidden="true" size={23} />}</button>
        <nav id="site-nav" aria-label="Main navigation" className={(open ? 'flex' : 'hidden') + ' lg:flex absolute lg:static left-0 right-0 top-full bg-[#fffefb] border-b-2 lg:border-0 border-foreground/20 p-6 lg:p-0 flex-col lg:flex-row gap-2 lg:items-center'}>
            {links.map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={pathname === link.href ? 'page' : undefined} className="warm-nav-link"><link.icon size={17} strokeWidth={1.8} aria-hidden="true" />{link.label}</a>)}
            {signedIn && <form action={signOut}><button className="text-sm underline py-2">Sign out</button></form>}
        </nav>
    </>;
}
