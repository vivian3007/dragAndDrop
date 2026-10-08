import { PatternRow } from "./patternTerms";

// Kleurwissels binnen één vorm: banen in een andere kleur (strepen, een witte buik, een
// gekleurde punt). Een baan loopt van `from` tot `to` als fractie van de haakvolgorde:
// 0 = ronde 1 (het begin, bv. de top van een bol of de punt van een kegel), 1 = de laatste
// ronde. Zo blijft een baan op dezelfde plek als de vorm groter wordt of het garen dikker —
// dan verandert alleen het aantal rondes. Latere banen gaan voor eerdere.
export type Stripe = { from: number; to: number; color: string };

// Fractie van het midden van ronde `row` (van `rows`) in de haakvolgorde.
export function rowFraction(row: number, rows: number): number {
    return (row - 0.5) / Math.max(rows, 1);
}

// Kleur van een plek in de haakvolgorde (fractie 0..1), of null voor de kleur van de vorm.
export function stripeColorAt(fraction: number, stripes: Stripe[] | null | undefined): string | null {
    let color: string | null = null;
    for (const stripe of stripes ?? []) {
        if (fraction >= Math.min(stripe.from, stripe.to) && fraction < Math.max(stripe.from, stripe.to)) color = stripe.color;
    }
    return color;
}

// De rondes (1-based, t/m) die een baan beslaat bij `rows` rondes — voor de editor, die met
// rondes werkt. Minstens één ronde, ook als de baan bij weinig rondes tussen twee in valt.
export function stripeRows(stripe: Stripe, rows: number): { from: number; to: number } {
    const total = Math.max(rows, 1);
    const clamp = (row: number) => Math.min(Math.max(row, 1), total);
    const from = clamp(Math.round(Math.min(stripe.from, stripe.to) * total) + 1);
    const to = clamp(Math.round(Math.max(stripe.from, stripe.to) * total));
    return { from, to: Math.max(from, to) };
}

// Baan voor rondes `from` t/m `to` (van `rows`), als fractie — het omgekeerde van stripeRows.
export function stripeFromRows(from: number, to: number, rows: number, color: string): Stripe {
    const total = Math.max(rows, 1);
    return { from: (Math.min(from, to) - 1) / total, to: Math.max(from, to) / total, color };
}

export function rowColor(row: number, rows: number, stripes: Stripe[] | null | undefined): string | null {
    return stripeColorAt(rowFraction(row, rows), stripes);
}

// Een reeks rondes opsplitsen waar de kleur verandert, en elke regel z'n kleur geven.
function splitByColor(rows: PatternRow[], totalRows: number, stripes: Stripe[]): PatternRow[] {
    return rows.flatMap((row) => {
        const parts: PatternRow[] = [];
        for (let r = row.from; r <= row.to; r++) {
            const color = rowColor(r, totalRows, stripes);
            const last = parts[parts.length - 1];
            if (last && last.color === color) last.to = r;
            else parts.push({ ...row, from: r, to: r, color });
        }
        return parts;
    });
}

type ColorablePattern = {
    rows: number;
    lastRow: number;
    closed: boolean;
    incArray: PatternRow[];
    scArray: PatternRow[];
    decArray: PatternRow[];
};

// Het patroon met kleurwissels: regels opgesplitst op de grenzen, met per regel z'n kleur
// (null = kleur van de vorm), plus de kleur van ronde 1 en van de slotronde (die schrijft
// Pattern.tsx zelf).
export function applyStripes<P extends ColorablePattern>(pattern: P, stripes: Stripe[] | null | undefined) {
    const list = stripes ?? [];
    return {
        ...pattern,
        incArray: splitByColor(pattern.incArray, pattern.rows, list),
        scArray: splitByColor(pattern.scArray, pattern.rows, list),
        decArray: splitByColor(pattern.decArray, pattern.rows, list),
        startColor: rowColor(1, pattern.rows, list),
        closingColor: pattern.closed ? rowColor(pattern.lastRow, pattern.rows, list) : null,
    };
}

// Steken per ronde met hun kleur, inclusief ronde 1 (6) en de slotronde (6) — voor de
// garenschatting per kleur.
export function stitchesWithColor(
    pattern: ReturnType<typeof applyStripes<ColorablePattern>>,
    shapeColor: string,
): { stitches: number; color: string }[] {
    const result = [{ stitches: 6, color: pattern.startColor ?? shapeColor }];
    for (const row of [...pattern.incArray, ...pattern.scArray, ...pattern.decArray]) {
        for (let r = row.from; r <= row.to; r++) result.push({ stitches: row.stitches, color: row.color ?? shapeColor });
    }
    if (pattern.closed) result.push({ stitches: 6, color: pattern.closingColor ?? shapeColor });
    return result;
}
