const origin = 'https://ratemydegrees.com';

export function degreeUrl(cip4: string) {
    return `${origin}/majors/${encodeURIComponent(cip4)}`;
}

export function programUrl(cip4: string, unitid: string) {
    return `${degreeUrl(cip4)}/${encodeURIComponent(unitid)}`;
}
