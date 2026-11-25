import { describe, expect, it } from 'vitest';
import { formatTag, sameTag, uniqueTags } from './tags';
import { filterAndSortAmigurumis } from './filterAmigurumis';

describe('tags', () => {
    it('maakt een tag netjes: hoofdletter, zonder # en dubbele spaties', () => {
        expect(formatTag('dier')).toBe('Dier');
        expect(formatTag('  #klein   formaat ')).toBe('Klein formaat');
        expect(formatTag('')).toBe('');
    });

    it('ziet tags met andere hoofdletters als dezelfde', () => {
        expect(sameTag('Dier', 'dier')).toBe(true);
        expect(sameTag('#dier', 'DIER')).toBe(true);
        expect(sameTag('Dier', 'Dieren')).toBe(false);
    });

    it('houdt van dubbele tags er één over, in de nette vorm', () => {
        expect(uniqueTags(['dier', 'Klein', 'Dier', '#klein', 'beer'])).toEqual(['Dier', 'Klein', 'Beer']);
    });

    it('filtert hoofdletterongevoelig op tags', () => {
        const designs = [
            { id: 'a', name: 'Kat', tags: ['dier'] },
            { id: 'b', name: 'Hond', tags: ['Dier'] },
            { id: 'c', name: 'Bloem', tags: ['Plant'] },
        ] as unknown as Amigurumi[];
        const found = filterAndSortAmigurumis(designs, '', ['Dier'], 'name').map((d) => d.id);
        expect(found.sort()).toEqual(['a', 'b']);
    });
});
