import { Timestamp } from 'firebase/firestore';

// `createdAt` is in Firestore een Timestamp, lokaal net na aanmaken soms een Date, en vlak
// na een serverTimestamp()-schrijfactie nog even een placeholder. Deze helpers geven in
// alle gevallen iets bruikbaars terug.

export function timestampMillis(value: unknown): number {
    if (value instanceof Timestamp) return value.toMillis();
    if (value instanceof Date) return value.getTime();
    return 0;
}

export function timestampDate(value: unknown): Date | null {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    return null;
}
