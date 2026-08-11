import {useEffect} from "react";
import {useLocation} from "react-router-dom";

const generateSpherePattern = (singleShape: Shape, yarnWeight: string, PIXELS_PER_CM: number, rowHeights: Record<string, number>, intersections, shapes: Shape[]) => {
    const rowHeight = rowHeights[yarnWeight] * PIXELS_PER_CM ?? 4;
    const shapeHeight = singleShape.width > singleShape.height ? singleShape.width : singleShape.height;
    const shapeWidth = singleShape.width > singleShape.height ? singleShape.height : singleShape.width;

    console.log(singleShape.name, shapeHeight, shapeWidth)

    const rows = shapeHeight ? shapeHeight / rowHeight + 1 : 0;
    const extraScRows = shapeHeight && shapeWidth ? (shapeHeight - shapeWidth) / rowHeight : 0;
    const incRows = Math.floor((rows - extraScRows) / 3);
    const decRows = Math.floor(incRows);
    const scRows = Math.floor(rows - incRows - decRows);

    const rowArray = [];
    const incArray = [];
    const scArray = [];
    const decArray = [];
    const intersectionRows = [];

    intersections.forEach((intersection) => {
        if (intersection.source === "sphere-analytic") {
            // shape1 = het vastgemaakte (kleinere) object, shape2 = het basis-object. De
            // assembly noemt de rijen van de basis-vorm, dus deze entry wordt geproduceerd
            // door de generatie-call van shape2 (singleShape is dan de basis-vorm zelf, en
            // `rows` hierboven is dus al de eigen rij-telling van die basis-vorm).
            if (intersection.shape2 !== singleShape.id) return;

            // Camera-onafhankelijk: axisOffsetFraction/axisRadiusFraction liggen op de
            // schaal [-1 (onderpool) .. +1 (bovenpool)] van de basis-vorm z'n eigen radius
            // (zie calculateIntersections.tsx) en zijn exact cos(θ) t.o.v. de bovenpool.
            // Conventie: rij 1 is de bovenkant van de vorm, de rijen tellen naar onderen.
            const toRow = (fractionOfRadius) => {
                // Clamp naar het domein van acos: axisOffsetFraction ± axisRadiusFraction kan
                // door drijvendekomma-afronding, of door de (elders, bewust buiten scope
                // gelaten) tilt-simplificatie in calculateIntersections.tsx, licht buiten
                // [-1,1] vallen — zonder deze clamp geeft Math.acos dan NaN.
                const clamped = Math.min(1, Math.max(-1, fractionOfRadius));
                // Poolhoek θ vanaf de bovenpool (θ=0 bovenpool, θ=π onderpool). Rijen liggen
                // met gelijke stappen in θ (gelijke fysieke rij-hoogte langs het gehaakte
                // oppervlak), niet met gelijke stappen in de cartesiaanse y-fractie — vandaar
                // acos in plaats van een lineaire mapping. Dit maakt de rijverdeling dichter
                // bij de polen en ruimer bij de evenaar, zoals bij een echte bol.
                const theta = Math.acos(clamped);
                const rowFractionFromTop = theta / Math.PI; // 0 = boven, 1 = onder
                return Math.min(Math.floor(rows) || 1, Math.max(1, Math.round(rowFractionFromTop * (rows - 1)) + 1));
            };
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

        if (intersection.shape1 !== singleShape.id) return;

        // Legacy pixel-space pad — nog nodig voor Sphere-Arm (CSG-afgeleide) paren.
        if (intersection.pixelDistanceHeight > intersection.pixelDistanceWidth) {
            const topRow = Math.floor(intersection.topToHighestPoint / (singleShape.height / rows))
            const bottomRow = Math.floor(intersection.pixelDistanceHeight / rows);
            intersectionRows.push({
                shapeId1: intersection.shape1,
                shapeId2: intersection.shape2,
                topRow,
                bottomRow,
            });
        } else if (intersection.pixelDistanceWidth > intersection.pixelDistanceHeight) {
            const topRow = 0;
            const bottomRow = Math.floor(intersection.pixelDistanceWidth / rows)
            intersectionRows.push({
                shapeId1: intersection.shape1,
                shapeId2: intersection.shape2,
                topRow,
                bottomRow,
            });
        }
    });

    // const topRow = Math.floor(intersections[1].topToHighestPoint / (intersectionShapes[1].height / rows));
    // const bottomRow = Math.floor(intersections[1].pixelDistanceHeight / rows);

    // intersectionShapes.map((intersectionShape) => intersectionShape.height)
    // console.log(topRow, bottomRow)
    console.log(intersectionRows);

    for (let i = 1; i < rows + 1; i++) {
        rowArray.push(i);
    }

    console.log(rowArray)

    for (let i = 1; i < incRows; i++) {
        incArray.push(`Row ${rowArray[i + 1]}: [1inc, ${i}sc] * 6 (${12 + i * 6})`);
    }

    console.log(singleShape.name, incRows);

    const maxStitches = incRows * 6 + 6;

    if (scRows > 0) {
        const startRow = incRows > 1 ? incRows + 2 : incRows + 1;
        const endRow = incRows + scRows;
        const rowText = scRows === 1 ? `Row ${startRow}` : `Row ${startRow}-${endRow}`;
        scArray.push(`${rowText}: ${maxStitches}sc (${maxStitches})`);
    }

    let currentStitches = maxStitches;

    for (let i = 0; i < decRows - 1; i++) {
        currentStitches -= 6;
        const rowIndex = incRows + scRows + i;
        decArray.push(`Row ${rowArray[rowIndex]}: [1dec, ${decRows - i - 1}sc] * 6 (${currentStitches})`);
    }

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
        incArray,
        scArray,
        decArray,
        rowArray,
        intersectionRows,
    };
};

export default generateSpherePattern;