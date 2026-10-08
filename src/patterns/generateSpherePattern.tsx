import { decreaseRow, englishPatternTerms, evenRows, increaseRow, PatternRow, PatternTerms } from "./patternTerms";
import { shapeDimensionCm } from "../geometry/units";
import { maxStitchesForDiameter, STITCH_WIDTH_PER_ROW_HEIGHT } from "./stitchGeometry";
import { sphereEndAngle, sphereOpening } from "../geometry/sphereOpening";

const generateSpherePattern = (singleShape: Shape, yarnWeight: string, rowHeights: Record<string, number>, intersections: Intersection[], t: PatternTerms = englishPatternTerms) => {
    const rowHeightCm = rowHeights[yarnWeight] ?? rowHeights.Medium;
    const stitchWidthCm = rowHeightCm * STITCH_WIDTH_PER_ROW_HEIGHT;

    // Echte maten in cm (zoom meegerekend, en een bol is 2× z'n width — zie pixelsPerCm).
    // Er wordt gehaakt langs de langste as (ook als dat de diepte is); de doorsnede daar
    // loodrecht op is het gemiddelde van de twee andere assen (een "cirkel met
    // gelijkwaardige omtrek").
    // Met een opening (geometry/sphereOpening.ts) wordt er altijd naar de opening toe gehaakt:
    // langs de eigen hoogte-as, met breedte en lengte als doorsnede.
    const isOpen = sphereOpening(singleShape) > 0;
    const [crossA, crossB, axisCm] = isOpen
        ? [shapeDimensionCm(singleShape, "width"), shapeDimensionCm(singleShape, "length"), shapeDimensionCm(singleShape, "height")]
        : [
            shapeDimensionCm(singleShape, "width"),
            shapeDimensionCm(singleShape, "height"),
            shapeDimensionCm(singleShape, "length"),
        ].sort((a, b) => a - b);
    const crossCm = (crossA + crossB) / 2;

    // Steken: de omtrek op het breedste punt. Rondes: de gangbare opbouw van een
    // amigurumi-bal — meerderen tot M (M/6 rondes), ongeveer evenveel vaste rondes, en
    // terug minderen (M/6 - 1 rondes). De meerrondes liggen bijna plat, dus puur rekenen
    // met de halve omtrek gaf te veel vaste rondes (een capsule i.p.v. een bal). Is de vorm
    // langer dan breed, dan komen er vaste rondes bij voor het verschil; is hij platter,
    // dan gaan er af.
    const maxStitches = maxStitchesForDiameter(crossCm, stitchWidthCm);
    const incRows = maxStitches / 6; // ronde 1 (6) t/m ronde M/6 (M)
    // Met een opening (geometry/sphereOpening.ts) minder je maar tot de steken van de opening
    // en blijft de bol open; anders tot 6 en naai je dicht.
    const opening = sphereOpening(singleShape);
    const closed = opening === 0;
    const openingStitches = closed ? 6 : Math.min(maxStitches, Math.max(6, Math.round((opening * maxStitches) / 6) * 6));
    const decRows = (maxStitches - openingStitches) / 6; // M-6 t/m de opening (of 6)
    const endAngle = sphereEndAngle(opening);
    const scRows = Math.max(0, maxStitches / 6 + Math.round((axisCm - crossCm) / rowHeightCm));
    const rows = incRows + scRows + decRows;

    const rowArray: number[] = [];
    const incArray: PatternRow[] = [];
    const scArray: PatternRow[] = [];
    const decArray: PatternRow[] = [];
    const intersectionRows: IntersectionRow[] = [];

    // Camera-onafhankelijk: de meegegeven fractie ligt op de schaal [-1 (onderpool) ..
    // +1 (bovenpool)] van de vorm z'n eigen radius en is exact cos(θ) t.o.v. de bovenpool
    // (zie calculateIntersections.tsx). Conventie: rij 1 is de bovenkant van de vorm, de
    // rijen tellen naar onderen. Gedeeld tussen de analytische Sphere-Sphere route en de
    // CSG-afgeleide route (Sphere-Arm) — voor beide is de vorm zelf hier gewoon een bol.
    const toRow = (fractionOfRadius: number) => {
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
        const rowFractionFromTop = Math.min(1, theta / endAngle); // 0 = boven, 1 = onder (of de opening)
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

    // Ronde 1 (magische ring, 6) schrijft Pattern.tsx zelf; vanaf ronde 2 komen ze hier vandaan.
    for (let row = 2; row <= incRows; row++) {
        incArray.push(increaseRow(t, row, (row - 1) * 6));
    }

    if (scRows > 0) {
        const startRow = incRows + 1;
        const endRow = incRows + scRows;
        scArray.push(evenRows(t, startRow, endRow, maxStitches));
    }

    // Minderen tot 12; de slotronde "6 min (6)" op `lastRow` schrijft Pattern.tsx zelf. Met een
    // opening tot en met de steken van de opening.
    const lastDecrease = closed ? 12 : openingStitches;
    for (let stitches = maxStitches - 6, row = incRows + scRows + 1; stitches >= lastDecrease; stitches -= 6, row++) {
        decArray.push(decreaseRow(t, row, stitches));
    }
    const lastRow = rows;

    // Totaal aantal steken over alle rondes, voor de garenschatting: 6, 12, …, M, dan
    // scRows × M, en terug M-6, …, 6.
    let stitchCount = 0;
    for (let row = 1; row <= incRows; row++) stitchCount += row * 6;
    stitchCount += scRows * maxStitches;
    for (let stitches = maxStitches - 6; stitches >= openingStitches; stitches -= 6) stitchCount += stitches;

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
        // Dicht: Pattern.tsx zet er "begin met vullen" en de slotronde (6 min) bij.
        closed,
        flat: false,
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
