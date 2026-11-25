import { decreaseRow, evenRows, increaseRow, PatternRow, PatternTerms } from "./patternTerms";

// Patroonregels uit een lijst steken per ronde (`stitches[0]` = ronde 1), voor de rondes
// `from` t/m `to`. Elke ronde heeft 6 steken meer of minder dan de vorige (meerderen,
// minderen) of evenveel; opeenvolgende rondes zonder meerderen of minderen worden
// samengevoegd ("Ronde 5-7: 18 v (18)"). `backLoop`: rondes die in de achterste lus gaan.
export function stitchesToRows(t: PatternTerms, stitches: number[], from: number, to: number, backLoop: (row: number) => boolean = () => false): PatternRow[] {
    const lines: PatternRow[] = [];
    let row = Math.max(2, from);
    while (row <= to) {
        const current = stitches[row - 1];
        const previous = stitches[row - 2];
        if (current > previous) {
            lines.push(increaseRow(t, row, previous));
            row++;
        } else if (current < previous) {
            lines.push(decreaseRow(t, row, current));
            row++;
        } else {
            const blo = backLoop(row);
            let end = row;
            while (end + 1 <= to && stitches[end] === current && backLoop(end + 1) === blo) end++;
            lines.push(evenRows(t, row, end, current, blo));
            row = end + 1;
        }
    }
    return lines;
}
