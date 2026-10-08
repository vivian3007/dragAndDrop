// Een gewone naam voor een kleur ("bruin", "lichtblauw"), zodat je in het garenoverzicht niet
// alleen een bolletje ziet. De dichtstbijzijnde kleur uit een korte lijst; bewust grof, het is
// een hulpje naast het kleurvakje en de letter.

const NAMED_COLORS: { hex: string; nl: string; en: string }[] = [
    { hex: "#ffffff", nl: "wit", en: "white" },
    { hex: "#f3ead8", nl: "crème", en: "cream" },
    { hex: "#e3c9a0", nl: "beige", en: "beige" },
    { hex: "#b07a4b", nl: "lichtbruin", en: "light brown" },
    { hex: "#8b5a2b", nl: "bruin", en: "brown" },
    { hex: "#4e3020", nl: "donkerbruin", en: "dark brown" },
    { hex: "#111111", nl: "zwart", en: "black" },
    { hex: "#808080", nl: "grijs", en: "grey" },
    { hex: "#c8c8c8", nl: "lichtgrijs", en: "light grey" },
    { hex: "#c62828", nl: "rood", en: "red" },
    { hex: "#7b1f2b", nl: "donkerrood", en: "dark red" },
    { hex: "#f48fb1", nl: "roze", en: "pink" },
    { hex: "#ef6c00", nl: "oranje", en: "orange" },
    { hex: "#fdd835", nl: "geel", en: "yellow" },
    { hex: "#2e7d32", nl: "groen", en: "green" },
    { hex: "#9ccc65", nl: "lichtgroen", en: "light green" },
    { hex: "#1e63b0", nl: "blauw", en: "blue" },
    { hex: "#90caf9", nl: "lichtblauw", en: "light blue" },
    { hex: "#1a237e", nl: "donkerblauw", en: "navy" },
    { hex: "#7b1fa2", nl: "paars", en: "purple" },
    { hex: "#ce93d8", nl: "lila", en: "lilac" },
];

function rgb(hex: string): [number, number, number] | null {
    const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!match) return null;
    const value = parseInt(match[1], 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

// Afstand zoals het oog hem ongeveer ziet ("redmean"-benadering).
function distance(a: [number, number, number], b: [number, number, number]): number {
    const meanRed = (a[0] + b[0]) / 2;
    const [dr, dg, db] = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    return Math.sqrt((2 + meanRed / 256) * dr * dr + 4 * dg * dg + (2 + (255 - meanRed) / 256) * db * db);
}

export function colorName(hex: string, locale: string): string | null {
    const color = rgb(hex);
    if (!color) return null;
    let best = NAMED_COLORS[0];
    let bestDistance = Infinity;
    for (const named of NAMED_COLORS) {
        const d = distance(color, rgb(named.hex)!);
        if (d < bestDistance) {
            best = named;
            bestDistance = d;
        }
    }
    return locale.startsWith("nl") ? best.nl : best.en;
}
