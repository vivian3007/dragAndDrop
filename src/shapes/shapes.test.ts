import { describe, expect, it } from "vitest";
import { generatePattern } from "../patterns/generators";
import { ROW_HEIGHTS } from "../patterns/estimateYarn";
import { shapeOfCm, makeShape } from "../patterns/testShapes";
import { englishPatternTerms, formatRow, PatternRow } from "../patterns/patternTerms";
import { shapeDefinition } from "./registry";
import { normalizeProfile, profileFraction, profileRadiusAtHeight, insideProfile } from "./profile";
import { insideOutline, outlineSegmentsAt } from "./outline";
import { petalCount } from "./motifs";
import { attachToNearest } from "../geometry/attach";
import { insideLocal, worldToLocal } from "../geometry/shapeSpace";

type Pattern = NonNullable<ReturnType<typeof generatePattern>>;

const rowsOf = (pattern: Pattern): PatternRow[] => [...pattern.incArray, ...pattern.scArray, ...pattern.decArray];

// Steken per ronde van een vorm in rondes: ronde 1, dan alles uit de generator, dan de slotronde.
function stitchesPerRound(pattern: Pattern): number[] {
    const result = ["firstRow" in pattern && pattern.firstRow ? pattern.firstRow.stitches : 6];
    for (const line of rowsOf(pattern)) for (let i = line.from; i <= line.to; i++) result.push(line.stitches);
    if (pattern.closed) result.push(6);
    return result;
}

const generate = (shape: Shape) => generatePattern(shape, "Medium", ROW_HEIGHTS, [], englishPatternTerms)!;

describe("profiel: rekenwerk", () => {
    const profile = normalizeProfile([
        { r: 0, y: 0 },
        { r: 2, y: 0 },
        { r: 2, y: 4 },
        { r: 0, y: 4 },
    ]);

    it("normaliseert naar straal 0,5 en hoogte 0..1", () => {
        expect(Math.max(...profile.map((p) => p.r))).toBeCloseTo(0.5, 9);
        expect(Math.min(...profile.map((p) => p.y))).toBeCloseTo(0, 9);
        expect(Math.max(...profile.map((p) => p.y))).toBeCloseTo(1, 9);
    });

    it("straal op een hoogte, en zit-erin", () => {
        expect(profileRadiusAtHeight(profile, 0.5)).toBeCloseTo(0.5, 9);
        expect(insideProfile(profile, { x: 0.4, y: 0.5, z: 0 })).toBe(true);
        expect(insideProfile(profile, { x: 0.6, y: 0.5, z: 0 })).toBe(false);
        expect(insideProfile(profile, { x: 0, y: 1.2, z: 0 })).toBe(false);
    });

    it("haakvolgorde: van het begin van het profiel naar het eind", () => {
        // Bodem (lengte 0,5), zijkant (1), bovenkant (0,5): totaal 2.
        expect(profileFraction(profile, { x: 0, y: 0, z: 0 })).toBeCloseTo(0, 6);
        expect(profileFraction(profile, { x: 0.5, y: 0.5, z: 0 })).toBeCloseTo(0.5, 6);
        expect(profileFraction(profile, { x: 0, y: 1, z: 0 })).toBeCloseTo(1, 6);
    });
});

describe.each([
    ["Drop", { width: 4, height: 5, length: 4 }],
    ["Bottle", { width: 5, height: 7, length: 5 }],
    ["Peanut", { width: 4, height: 7, length: 4 }],
    ["OpenPeanut", { width: 4, height: 6, length: 4 }],
    ["MushroomCap", { width: 6, height: 3, length: 6 }],
])("profielvorm %s", (type, cm) => {
    const shape = shapeOfCm(type, cm);
    const pattern = generate(shape);
    const rounds = stitchesPerRound(pattern);
    const profile = shapeDefinition(type).profile!(shape);

    it("telt precies het aantal rondes, met per ronde 0 of 6 erbij of eraf", () => {
        expect(rounds.length).toBe(pattern.rows);
        rounds.forEach((stitches) => expect(stitches % 6).toBe(0));
        rounds.slice(1).forEach((stitches, i) => expect(Math.abs(stitches - rounds[i])).toBeLessThanOrEqual(6));
    });

    it("een dicht begin is een magische ring, een dicht eind sluit af met 12 → 6", () => {
        if (profile[0].r === 0) expect(rounds[0]).toBe(6);
        if (pattern.closed) expect(rounds.slice(-2)).toEqual([12, 6]);
    });

    it("de breedste ronde past bij de breedte van de vorm", () => {
        const widest = (Math.PI * cm.width) / (ROW_HEIGHTS.Medium * 1.1);
        expect(Math.max(...rounds)).toBeLessThanOrEqual(Math.round(widest / 6) * 6 + 6);
        expect(Math.max(...rounds)).toBeGreaterThanOrEqual(widest * 0.6);
    });

    it("het totaal aantal steken is de som van alle rondes", () => {
        expect(pattern.stitchCount).toBe(rounds.reduce((sum, n) => sum + n, 0));
    });

    it("een ronde in de achterste lus heeft evenveel steken als de vorige", () => {
        rowsOf(pattern).filter((row) => row.backLoop).forEach((row) => expect(rounds[row.from - 1]).toBe(rounds[row.from - 2]));
    });
});

describe("profielvormen: wat ze bijzonder maakt", () => {
    it("flesje: platte bodem met een ronde in de achterste lus, open bovenaan", () => {
        const pattern = generate(shapeOfCm("Bottle", { width: 5, height: 7, length: 5 }));
        expect(rowsOf(pattern).some((row) => row.backLoop)).toBe(true);
        expect(pattern.closed).toBe(false);
    });

    it("paddenstoelhoed: rand in de achterste lus, onderkant mindert tot een opening", () => {
        const pattern = generate(shapeOfCm("MushroomCap", { width: 6, height: 3, length: 6 }));
        const rounds = stitchesPerRound(pattern);
        expect(rowsOf(pattern).filter((row) => row.backLoop)).toHaveLength(1);
        expect(pattern.closed).toBe(false);
        expect(rounds[rounds.length - 1]).toBeLessThan(Math.max(...rounds));
    });

    it("pinda: smaller in het midden dan bij de twee bollen", () => {
        const rounds = stitchesPerRound(generate(shapeOfCm("Peanut", { width: 6, height: 10, length: 6 })));
        const peak = rounds.indexOf(Math.max(...rounds.slice(0, rounds.length / 2)));
        const waist = Math.min(...rounds.slice(peak, Math.round(rounds.length * 0.75)));
        expect(waist).toBeLessThan(rounds[peak]);
        expect(Math.max(...rounds.slice(Math.round(rounds.length / 2)))).toBeGreaterThan(waist);
    });

    // Een heel kleine dichte vorm: de slotronde (6 min, geschreven door Pattern.tsx) moet op een
    // ronde van 12 volgen, en een mindering naar 6 heet "6 min", niet "[1 min, 0 v] * 6".
    it.each(["Peanut", "Drop", "Bottle", "OpenPeanut"])("%s, heel klein: geen onmogelijke slotronde", (type) => {
        const pattern = generate(shapeOfCm(type, { width: 1, height: 3, length: 1 }));
        const rounds = stitchesPerRound(pattern);
        if (pattern.closed) expect(rounds.slice(-2)).toEqual([12, 6]);
        rounds.slice(1).forEach((stitches, i) => expect(Math.abs(stitches - rounds[i])).toBeLessThanOrEqual(6));
        rowsOf(pattern).forEach((row) => expect(formatRow(englishPatternTerms, row)).not.toMatch(/0sc/));
    });

    it("druppel: begint smal in de punt en is onderaan het breedst", () => {
        const rounds = stitchesPerRound(generate(shapeOfCm("Drop", { width: 4, height: 5, length: 4 })));
        // Het breedste stuk ligt voorbij het midden; vlak na de punt nog maar weinig steken.
        expect(rounds.lastIndexOf(Math.max(...rounds))).toBeGreaterThan(rounds.length / 2);
        expect(rounds[1]).toBeLessThanOrEqual(12);
    });
});

describe("omtrek: rekenwerk", () => {
    const square = [
        { x: -0.5, y: -0.5 },
        { x: 0.5, y: -0.5 },
        { x: 0.5, y: 0.5 },
        { x: -0.5, y: 0.5 },
    ];

    it("zit erin, en de stukken op een hoogte", () => {
        expect(insideOutline(square, 0, 0)).toBe(true);
        expect(insideOutline(square, 0.6, 0)).toBe(false);
        expect(outlineSegmentsAt(square, 0)).toEqual([[-0.5, 0.5]]);
    });

    it("een hart heeft bovenaan twee stukken (de bogen), onderaan één", () => {
        const outline = shapeDefinition("Heart").outline!(makeShape({ type: "Heart" }));
        expect(outlineSegmentsAt(outline, 0.4)).toHaveLength(2);
        expect(outlineSegmentsAt(outline, -0.2)).toHaveLength(1);
    });
});

// Steken die een rij gebruikt, uit de (Engelse) instructie: vasten 1, meerderen 1 (geeft er 2),
// minderen 2 (geeft er 1); "ch 1, turn" en "1sc in each of the next 4 st" tellen ook mee.
function consumed(instruction: string): number {
    const each = instruction.match(/^1sc in each of the next (\d+) st/);
    if (each) return Number(each[1]);
    return instruction.split(", ").reduce((sum, part) => {
        const [, count, kind] = part.match(/^(\d+)(sc|inc|dec)$/) ?? [];
        return kind ? sum + Number(count) * (kind === "dec" ? 2 : 1) : sum;
    }, 0);
}

describe.each([
    ["Heart", { width: 5, height: 0.3, length: 4.5 }],
    ["Heart", { width: 8, height: 0.3, length: 7 }],
    ["Patch", { width: 4, height: 0.3, length: 3 }],
])("motief in rijen: %s %o", (type, cm) => {
    const pattern = generate(shapeOfCm(type, cm));
    const lines = rowsOf(pattern);
    const rows = lines.filter((row) => !row.note);

    it("plat, open, in rijen", () => {
        expect(pattern.flat).toBe(true);
        expect(pattern.closed).toBe(false);
        expect(pattern.firstRow?.inRows).toBe(true);
        rows.forEach((row) => expect(row.inRows).toBe(true));
        expect(formatRow(englishPatternTerms, rows[0])).toMatch(/^Row \d/);
    });

    it("elke rij eindigt met 1 losse en keren, behalve de laatste rij van een stuk", () => {
        expect(pattern.firstRow!.instruction).toMatch(/ch 1, turn$/);
        // De laatste rij voor een aanwijzing (een boog of de rand) of aan het eind.
        lines.forEach((line, i) => {
            if (line.note) return;
            const next = lines[i + 1];
            const endOfPiece = !next || (next.note && !next.instruction.startsWith("First lobe"));
            if (endOfPiece) expect(line.instruction).not.toMatch(/turn$/);
            else expect(line.instruction).toMatch(/, ch 1, turn$/);
        });
    });

    it("symmetrisch: aan beide kanten evenveel erbij of eraf", () => {
        rows.forEach((row) => {
            const parts = row.instruction.replace(/, ch 1, turn$/, "").split(", ");
            if (parts.length === 3) expect(parts[0]).toBe(parts[2]);
        });
    });

    it("elke rij werkt precies de vorige rij uit", () => {
        let previous = pattern.firstRow!.stitches;
        for (const line of lines) {
            if (line.note) {
                // Een boog begint op een helft van de rij eronder.
                const half = line.instruction.match(/(\d+) stitches/);
                if (half) previous = Number(half[1]);
                continue;
            }
            for (let i = line.from; i <= line.to; i++) {
                expect(consumed(line.instruction)).toBe(previous);
                previous = line.stitches;
            }
        }
    });

    if (type === "Heart") {
        it("twee bogen en een rand rondom", () => {
            const notes = lines.filter((line) => line.note).map((line) => line.instruction);
            expect(notes[0]).toMatch(/^First lobe/);
            expect(notes[1]).toMatch(/^Second lobe/);
            expect(notes[2]).toMatch(/^Border/);
        });
    }
});

describe.each([
    [{ width: 2, height: 0.3, length: 5 }, 1],
    [{ width: 2.5, height: 0.3, length: 5 }, 2],
    [{ width: 4, height: 0.3, length: 7 }, 3],
])("blaadje %o", (cm, rounds) => {
    const pattern = generate(shapeOfCm("Leaf", cm));

    it("rond een rij lossen: aan beide kanten dezelfde steken, gespiegeld, met een lossenboog in de punt", () => {
        const text = pattern.firstRow!.instruction;
        const [, chains, sideA] = text.match(/^ch (\d+); starting in the 2nd ch from the hook: ([^;]+);/)!;
        const sideB = text.match(/along the other side of the chain: ([^;]+);/)![1];
        expect(sideB.split(", ").reverse().join(", ")).toBe(sideA);
        expect(text).toContain("(1sc, 2ch, 1sc) in the last ch");
        expect(text).toMatch(/1sl st in the first st$/);
        // Eén steek per losse, op de laatste (de punt) na.
        const along = sideA.split(", ").reduce((sum, part) => sum + Number(part.match(/^(\d+)/)![1]), 0);
        expect(along).toBe(Number(chains) - 2);
    });

    it("van een halve vaste steeds één steeksoort hoger (hooguit stokjes) en voor de punt terug tot een vaste", () => {
        const ladder = ["sl st", "sc", "hdc", "dc"];
        const sideA = pattern.firstRow!.instruction.match(/hook: ([^;]+);/)![1].split(", ");
        const levels = sideA.map((part) => ladder.indexOf(part.replace(/^\d+/, "")));
        levels.forEach((level) => expect(level).toBeGreaterThanOrEqual(0));
        expect(levels[0]).toBe(0);
        expect(levels[levels.length - 1]).toBeLessThanOrEqual(1);
        levels.slice(1).forEach((level, i) => expect(Math.abs(level - levels[i])).toBeLessThanOrEqual(1));
        expect(Math.max(...levels)).toBeGreaterThanOrEqual(2);
    });

    it(`${rounds} ronde(s): bredere blaadjes krijgen rondes vasten rondom`, () => {
        expect(pattern.rows).toBe(rounds);
    });
});

describe.each([
    ["Flower", 5, 5],
    ["Flower", 7, 5],
    ["Flower", 5, 8],
    ["Star", 5, 4],
    ["Star", 5, 6],
    ["Star", 5, 9],
    ["Star", 6, 7],
])("motief in rondes: %s met %i, %i cm", (type, petals, size) => {
    const shape = shapeOfCm(type, { width: size, height: 0.3, length: size }, { petals });
    const pattern = generate(shape);
    const lines = rowsOf(pattern);
    // Het hart: alles behalve de laatste ronde (de blaadjes of punten).
    const centerRounds = lines.slice(0, -1);

    it("begint met een magische ring van zoveel steken als blaadjes of punten, het hart groeit per ronde met evenveel", () => {
        expect(pattern.firstRow?.stitches).toBe(petals);
        expect(pattern.firstRow?.instruction).toContain("magic ring");
        centerRounds.forEach((row, i) => expect(row.stitches).toBe((i + 2) * petals));
        expect(centerRounds.length).toBeGreaterThanOrEqual(1);
    });

    if (type === "Flower") {
        it("elk blaadje gaat over evenveel steken als het hart rondes heeft, en begint met een halve vaste", () => {
            const k = centerRounds.length + 1;
            const petal = lines[lines.length - 1].instruction;
            expect(petal.startsWith("[1sl st, ")).toBe(true);
            expect(petal.endsWith(`] * ${petals}`)).toBe(true);
            // 1 halve vaste + de steken waar iets "in" gaat + "in each of the next n".
            const inNext = (petal.match(/in the next st/g) ?? []).length;
            const each = Number(petal.match(/in each of the next (\d+) st/)?.[1] ?? 0);
            expect(1 + inNext + each).toBe(k);
        });
    } else {
        it("één ronde punten, elk over evenveel steken als het hart rondes heeft, met een top van twee hoge steken", () => {
            const k = centerRounds.length + 1;
            expect(k % 2).toBe(0);
            const points = lines[lines.length - 1].instruction;
            expect(points.endsWith(`] * ${petals}`)).toBe(true);
            // Een top met lossen ertussen: (1dc, 2ch, 1dc), (1tr, 1ch, 1tr) of, bij een kleine
            // ster, twee steken met 2 lossen ertussen.
            expect(points).toMatch(/\(1(dc|tr), \dch, 1(dc|tr)\) in the next st|, 2ch, /);
            // Steken van het hart per punt: elke "in the next st", elke losse vaste en de halve vaste.
            const inner = points.slice(1, points.lastIndexOf("]"));
            const parts = inner.split(/, (?![^(]*\))/);
            const used = parts.filter((part) => /in the next st$|^1sc$|^1sl st$/.test(part)).length;
            expect(used).toBe(k);
            expect(k * petals).toBe(centerRounds[centerRounds.length - 1].stitches);
        });
    }
});

describe("motieven: aantal blaadjes en aansluiten", () => {
    it("blaadjes tussen 4 en 8, standaard 5", () => {
        expect(petalCount({})).toBe(5);
        expect(petalCount({ petals: 2 })).toBe(4);
        expect(petalCount({ petals: 12 })).toBe(8);
    });

    it("een hartje sluit plat en rechtop aan op een bol", () => {
        const body = makeShape({ id: "lijf", type: "Sphere", width: 150, height: 150, length: 150 });
        const heart = makeShape({ id: "hart", type: "Heart", width: 60, height: 11, length: 55, z: 2, rotation_x: 90 });
        const placed = attachToNearest(heart, [body])!.shape;
        // Het midden van de onderkant van het hartje zit in (of op) de bol.
        expect(insideLocal(body, worldToLocal(body, { x: placed.x, y: placed.y - 0.01, z: placed.z - 0.01 }))).toBe(true);
        // Rechtop: z'n bovenkant (−z in z'n eigen ruimte) wijst omhoog.
        expect(Math.abs(placed.rotation_z) < 1 || Math.abs(Math.abs(placed.rotation_z) - 180) < 1).toBe(true);
    });
});

describe("3D van een plat motief", () => {
    it("boven wijst omhoog, onder omlaag, de rand naar buiten (voor elke omtrek, linksom of rechtsom)", async () => {
        const THREE = await import("three");
        const { createOutlineGeometry } = await import("./geometryBuilders");
        for (const type of ["Heart", "Leaf", "Flower", "Star", "Patch"]) {
            for (const reverse of [false, true]) {
                const outline = shapeDefinition(type).outline!(makeShape({ type }));
                const geometry = createOutlineGeometry(reverse ? [...outline].reverse() : outline);
                const position = geometry.attributes.position;
                const index = geometry.index!;
                const a = new THREE.Vector3();
                const b = new THREE.Vector3();
                const c = new THREE.Vector3();
                for (let i = 0; i < index.count; i += 3) {
                    a.fromBufferAttribute(position, index.getX(i));
                    b.fromBufferAttribute(position, index.getX(i + 1));
                    c.fromBufferAttribute(position, index.getX(i + 2));
                    const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
                    if (normal.lengthSq() < 1e-12) continue;
                    const center = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
                    const outward = Math.abs(center.y - 1) < 1e-6 ? new THREE.Vector3(0, 1, 0)
                        : Math.abs(center.y) < 1e-6 ? new THREE.Vector3(0, -1, 0)
                            : new THREE.Vector3(center.x, 0, center.z);
                    expect(normal.dot(outward)).toBeGreaterThan(0);
                }
            }
        }
    });
});

describe("zinnetjes voor de motieven", () => {
    it("staan in elke taal, met dezelfde plekken", async () => {
        const { PHRASES } = await import("../patterns/patternTerms");
        const nl = (await import("../i18n/locales/nl.json")).default as Record<string, string>;
        const en = (await import("../i18n/locales/en.json")).default as Record<string, string>;
        const places = (text: string) => [...text.matchAll(/\{(\w+)/g)].map((match) => match[1]).sort();
        for (const [id, english] of Object.entries(PHRASES)) {
            for (const messages of [nl, en]) {
                const message = messages[`pattern.phrase.${id}`];
                expect(message, id).toBeTruthy();
                expect(places(message), id).toEqual(places(english));
            }
        }
    });
});
