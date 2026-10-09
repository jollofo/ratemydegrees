/** Accept spaces or hyphens from copied email codes without changing the digits. */
export function normalizeEmailOtpInput(value: string): string {
    return /^[0-9\s-]*$/.test(value) ? value.replace(/[\s-]/g, '') : value;
}

/** Supabase email OTP length can be configured from six to ten digits. */
export function isValidEmailOtp(value: string): boolean {
    return /^[0-9]{6,10}$/.test(value);
}
