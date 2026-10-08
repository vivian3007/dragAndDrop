// Types voor searchTerms.js (gewoon JavaScript, zodat ook scripts/ het kan gebruiken).
export const MAX_TERM_LENGTH: number;
export function searchWords(text: string | null | undefined): string[];
export function buildSearchTerms(name: string, tags?: string[]): string[];
export function sortableName(name: string): string;
export function normalizeTag(tag: string): string;
export function searchFields(name: string, tags?: string[]): { searchTerms: string[]; nameLower: string; tagsLower: string[] };
export function serverSearchTerm(query: string): string | null;
export function matchesSearch(name: string, tags: string[], query: string): boolean;
