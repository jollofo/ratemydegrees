import { redirect } from 'next/navigation';
import { safeDestination } from '@/lib/navigation';

export default function AuthRedirectPage({ searchParams }: { searchParams: { next?: string } }) {
    redirect(safeDestination(searchParams.next));
}
