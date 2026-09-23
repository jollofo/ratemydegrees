import { redirect } from 'next/navigation';
import { safeDestination } from './navigation';

export function redirectToLogin(currentPath: string): never {
    redirect('/login?next=' + encodeURIComponent(safeDestination(currentPath)));
}
export function getLoginRedirectUrl(params: { next?: string; returnTo?: string }): string {
    return safeDestination(params.next || params.returnTo);
}
