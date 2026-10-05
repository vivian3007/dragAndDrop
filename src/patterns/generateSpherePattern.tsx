import {englishPatternTerms, PatternTerms} from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { maxStitchesForDiameter, STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";

const generateSpherePattern = (singleShape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections, shapes: Shape[], t: PatternTerms = englishPatternTerms) => {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;

    // Echte maten in cm (zoom meegerekend, en een bol is 2× z'n width — zie pixelsPerCm).
    // Er wordt gehaakt langs de langste as (ook als dat de diepte is); de doorsnede daar
    // loodrecht op is het gemiddelde van de twee andere assen (een "cirkel met
    // gelijkwaardige omtrek").
    const [crossA, crossB, axisCm] = [
        shapeDimensionCm(singleShape, "width"),
        shapeDimensionCm(singleShape, "height"),
        shapeDimensionCm(singleShape, "length"),
    ].sort((a, b) => a - b);
    const crossCm = (crossA + crossB) / 2;

    // Steken: de omtrek op het breedste punt. Toeren: de gangbare opbouw van een
    // amigurumi-bal — meerderen tot M (M/6 toeren), ongeveer evenveel vaste toeren, en
    // terug minderen (M/6 - 1 toeren). De meertoeren liggen bijna plat, dus puur rekenen
    // met de halve omtrek gaf te veel vaste toeren (een capsule i.p.v. een bal). Is de vorm
    // langer dan breed, dan komen er vaste toeren bij voor het verschil; is hij platter,
    // dan gaan er af.
    const maxStitches = maxStitchesForDiameter(crossCm, stitchWidthCm);
    const incRows = maxStitches / 6; // toer 1 (6) t/m toer M/6 (M)
    const decRows = maxStitches / 6 - 1; // M-6 t/m 6
    const scRows = Math.max(0, maxStitches / 6 + Math.round((axisCm - crossCm) / rowHeightCm));
    const rows = incRows + scRows + decRows;

    const rowArray: number[] = [];
    const incArray: string[] = [];
    const scArray: string[] = [];
    const decArray: string[] = [];
    const intersectionRows = [];

    // Camera-onafhankelijk: de meegegeven fractie ligt op de schaal [-1 (onderpool) ..
    // +1 (bovenpool)] van de vorm z'n eigen radius en is exact cos(θ) t.o.v. de bovenpool
    // (zie calculateIntersections.tsx). Conventie: rij 1 is de bovenkant van de vorm, de
    // rijen tellen naar onderen. Gedeeld tussen de analytische Sphere-Sphere route en de
    // CSG-afgeleide route (Sphere-Arm) — voor beide is de vorm zelf hier gewoon een bol.
    const toRow = (fractionOfRadius) => {
        // Clamp naar het domein van acos: de fractie kan door drijvendekomma-afronding, of
        // door bewust buiten scope gelaten vereenvoudigingen (tilt bij Sphere-Sphere, de
        // CSG-overlapvorm bij Sphere-Arm), licht buiten [-1,1] vallen — zonder deze clamp
        // geeft Math.acos dan NaN.
        const clamped = Math.min(1, Math.max(-1, fractionOfRadius));
        // Poolhoek θ vanaf de bovenpool (θ=0 bovenpool, θ=π onderpool). Rijen liggen met
        // gelijke stappen in θ (gelijke fysieke rij-hoogte langs het gehaakte oppervlak),
        // niet met gelijke stappen in de cartesiaanse y-fractie — vandaar acos in plaats
        // van een lineaire mapping. Dit maakt de rijverdeling dichter bij de polen en
        // ruimer bij de evenaar, zoals bij een echte bol.
        const theta = Math.acos(clamped);
        const rowFractionFromTop = theta / Math.PI; // 0 = boven, 1 = onder
        return Math.min(rows, Math.max(1, Math.round(rowFractionFromTop * (rows - 1)) + 1));
    };

    intersections.forEach((intersection) => {
        if (intersection.source === "sphere-analytic") {
            // shape1 = het vastgemaakte (kleinere) object, shape2 = het basis-object. De
            // assembly noemt de rijen van de basis-vorm, dus deze entry wordt geproduceerd
            // door de generatie-call van shape2 (singleShape is dan de basis-vorm zelf, en
            // `rows` hierboven is dus al de eigen rij-telling van die basis-vorm).
            if (intersection.shape2 !== singleShape.id) return;
            const bottomRow = toRow(intersection.axisOffsetFraction - intersection.axisRadiusFraction);
            const topRow = toRow(intersection.axisOffsetFraction + intersection.axisRadiusFraction);
            intersectionRows.push({
                shapeId1: intersection.shape1,
                shapeId2: intersection.shape2,
                topRow,
                bottomRow,
            });
            return;
        }

        if (intersection.source === "csg-world-axis") {
            // shape1 is hier altijd de vorm waar axisHighFraction/axisLowFraction relatief
            // aan berekend zijn (zie calculateIntersections.tsx) — alleen die vorm se eigen
            // generatie-call mag deze entry consumeren.
            if (intersection.shape1 !== singleShape.id) return;
            const topRow = toRow(intersection.axisHighFraction);
            const bottomRow = toRow(intersection.axisLowFraction);
            intersectionRows.push({
                shapeId1: intersection.shape1,
                shapeId2: intersection.shape2,
                topRow,
                bottomRow,
            });
            return;
        }
    });

    for (let i = 1; i <= rows; i++) {
        rowArray.push(i);
    }

    // Toer 1 (6) en toer 2 (12) schrijft Pattern.tsx zelf; vanaf toer 3 komen ze hier vandaan.
    for (let row = 3; row <= incRows; row++) {
        incArray.push(`${t.row(row)}: [${t.inc(1)}, ${t.sc(row - 2)}] * 6 (${row * 6})`);
    }

    if (scRows > 0) {
        const startRow = incRows + 1;
        const endRow = incRows + scRows;
        const rowText = scRows === 1 ? t.row(startRow) : t.row(`${startRow}-${endRow}`);
        scArray.push(`${rowText}: ${t.sc(maxStitches)} (${maxStitches})`);
    }

    // Minderen tot 12; de slottoer "6 min (6)" op `lastRow` schrijft Pattern.tsx zelf.
    for (let stitches = maxStitches - 6, row = incRows + scRows + 1; stitches >= 12; stitches -= 6, row++) {
        decArray.push(`${t.row(row)}: [${t.dec(1)}, ${t.sc(stitches / 6 - 1)}] * 6 (${stitches})`);
    }
    const lastRow = rows;

    // Totaal aantal steken over alle toeren, voor de garenschatting: 6, 12, …, M, dan
    // scRows × M, en terug M-6, …, 6.
    let stitchCount = 0;
    for (let row = 1; row <= incRows; row++) stitchCount += row * 6;
    stitchCount += scRows * maxStitches;
    for (let stitches = maxStitches - 6; stitches >= 6; stitches -= 6) stitchCount += stitches;

    return {
        type: singleShape.type,
        color: singleShape.color,
        name: singleShape.name,
        width: singleShape.width,
        height: singleShape.height,
        rotation_x: singleShape.rotation_x,
        rotation_y: singleShape.rotation_y,
        rotation_z: singleShape.rotation_z,
        rows,
        incRows,
        lastRow,
        stitchCount,
        incArray,
        scArray,
        decArray,
        rowArray,
        intersectionRows,
    };
};

export default generateSpherePattern;
