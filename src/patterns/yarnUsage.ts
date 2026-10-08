import { generatePattern } from "./generators";
import { estimateYarnByColor, ROW_HEIGHTS, yarnWeightKey } from "./estimateYarn";

// Het garenoverzicht op de patroonpagina: per kleur hoeveel meter, en waarvoor. Bij de eigen
// kleur van een onderdeel staat alleen de naam ("Lijf"); bij een kleurwissel ook de rondes
// ("Lijf (ronde 4–5)"), zodat je ziet waarom een onderdeel bij meer kleuren staat.

export type YarnUse = { name: string; rows: number[] | null }; // null = de eigen kleur van het onderdeel
export type YarnColor = { color: string; meters: number; uses: YarnUse[] };

// Kleur per ronde van één vorm (ronde 1 en de slotronde zitten niet in de generator-uitvoer).
function colorPerRow(shape: Shape, weightKey: string): Map<number, string> | null {
    const pattern = generatePattern(shape, weightKey, ROW_HEIGHTS, []);
    if (!pattern) return null;
    const base = shape.color ?? "#cccccc";
    const result = new Map<number, string>([[1, pattern.startColor ?? base]]);
    for (const row of [...pattern.incArray, ...pattern.scArray, ...pattern.decArray]) {
        for (let r = row.from; r <= row.to; r++) result.set(r, row.color ?? base);
    }
    if (pattern.closed) result.set(pattern.lastRow, pattern.closingColor ?? base);
    return result;
}

export function yarnUsage(shapes: Shape[], weight: string | null | undefined): { colors: YarnColor[]; total: number } {
    const weightKey = yarnWeightKey(weight);
    const { byColor, total } = estimateYarnByColor(shapes, weight);
    const colors = new Map<string, YarnColor>();

    for (const shape of shapes) {
        const rows = colorPerRow(shape, weightKey);
        if (!rows) continue; // bv. ogen: geen garen
        const name = shape.name ?? shape.type;
        const rowsByColor = new Map<string, number[]>();
        // De hoofdkleur eerst, dan de kleurwissels in haakvolgorde.
        const ordered = [...rows.entries()].sort(([a], [b]) => a - b);
        const base = shape.color ?? "#cccccc";
        if (ordered.some(([, color]) => color === base)) rowsByColor.set(base, []);
        for (const [row, color] of ordered) {
            if (!rowsByColor.has(color)) rowsByColor.set(color, []);
            rowsByColor.get(color)!.push(row);
        }
        for (const [color, colorRows] of rowsByColor) {
            const entry = colors.get(color) ?? { color, meters: byColor[color] ?? 0, uses: [] };
            entry.uses.push({ name, rows: color === base || colorRows.length === rows.size ? null : colorRows });
            colors.set(color, entry);
        }
    }
    return { colors: [...colors.values()], total };
}

// [1, 2, 3, 7] → [[1, 3], [7, 7]]
export function rowRanges(rows: number[]): [number, number][] {
    const ranges: [number, number][] = [];
    for (const row of [...rows].sort((a, b) => a - b)) {
        const last = ranges[ranges.length - 1];
        if (last && row === last[1] + 1) last[1] = row;
        else ranges.push([row, row]);
    }
    return ranges;
}
