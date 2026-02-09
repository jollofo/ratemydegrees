export interface ReviewRatings {
    rigor: number;
    career: number;
    difficulty: number;
    flexibility: number;
    satisfaction: number;
    value: number;
}

export interface ReviewFormData {
    majorId: string;
    institutionId: string;
    status: string;
    graduationYear: string;
    ratings: ReviewRatings;
    fit: string;
    challenge: string;
    misconception: string;
    differently: string;
    // Outcome fields
    outcomeStatus: string;
    jobTitle: string;
    industry: string;
    gradSchool: string;
    timeToOutcome: string;
}

export interface InstitutionSearchResult {
    unitid: string;
    name: string;
    state: string | null;
    city: string | null;
}

export interface MajorSearchResult {
    cip4: string;
    title: string;
    category: string | null;
    matchType?: 'DIRECT' | 'ALIAS' | 'PATHWAY' | 'RELATED';
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}
