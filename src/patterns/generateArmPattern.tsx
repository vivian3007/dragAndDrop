const generateArmPattern = (singleShape: Shape, yarnWeight: string, PIXELS_PER_CM: number, rowHeights: Record<string, number>, intersections, shapes) => {
    const rowHeight = rowHeights[yarnWeight] * PIXELS_PER_CM ?? 4;
    const shapeHeight = singleShape.height;
    // Doorsnede-basis voor omtrek-/stekenwiskunde: width (X) en length (Z) zijn onafhankelijk
    // instelbaar (zie ShapeSettings.tsx) en kunnen de Arm in 3D een ovale doorsnede geven,
    // terwijl het haakpatroon maar één omtrek-getal per rij kent. Gemiddelde van beide als
    // effectieve diameter — komt overeen met "cirkel met gelijkwaardige omtrek".
    const shapeWidth = (singleShape.width + singleShape.length) / 2;

    const rows = shapeHeight ? shapeHeight / rowHeight + 1 : 0;
    const extraScRows = shapeHeight && shapeWidth ? (shapeHeight - shapeWidth) / rowHeight : 0;
    const incRows = Math.floor((rows - extraScRows) / 3);
    const scRows = Math.floor(rows - incRows);

    const rowArray = [];
    const incArray = [];
    const scArray = [];
    const decArray = [];
    const intersectionRows = [];

    // Een cilinder heeft geen polen-compressie zoals een bol — rijen liggen al gelijkmatig
    // verdeeld over de lengte, dus lineaire mapping i.p.v. de acos-formule van Sphere.
    // Conventie: rij 1 is het bolvormige kapje (volgt uit de opbouw hieronder: incArray
    // eerst, geen sluit-rij — dus haken begint bij de ronding), de rijen tellen naar de
    // open onderkant toe.
    const toArmRow = (fractionOfLength) => {
        const clamped = Math.min(1, Math.max(0, fractionOfLength)); // 0=open onderkant, 1=kapje
        const rowFractionFromCap = 1 - clamped;
        return Math.min(Math.floor(rows) || 1, Math.max(1, Math.round(rowFractionFromCap * (rows - 1)) + 1));
    };

    intersections.forEach((intersection) => {
        if (intersection.source !== "csg-world-axis") return; // "sphere-analytic" gaat altijd over twee Sphere-vormen, niet relevant hier

        // Alleen koppelingen waarbij deze Arm zelf shape1 is — anders zou elke Arm in de
        // scene dezelfde koppeling opnieuw pushen zodra intersectionRows wordt teruggegeven,
        // wat dubbele regels in de Assembly-lijst zou opleveren (zie generateSpherePattern.tsx
        // voor dezelfde fix).
        if (intersection.shape1 !== singleShape.id) return;

        const topRow = toArmRow(intersection.axisHighFraction);
        const bottomRow = toArmRow(intersection.axisLowFraction);
        intersectionRows.push({
            shapeId1: intersection.shape1,
            shapeId2: intersection.shape2,
            topRow,
            bottomRow,
        });
    });

    for (let i = 1; i < rows + 1; i++) {
        rowArray.push(i);
    }

    for (let i = 1; i < incRows; i++) {
        incArray.push(`Row ${rowArray[i + 1]}: [1inc, ${i}sc] * 6 (${12 + i * 6})`);
    }

    const maxStitches = incRows * 6 + 6;

    if (scRows > 0) {
        const startRow = incRows + 2;
        const endRow = incRows + scRows;
        const rowText = scRows === 1 ? `Row ${startRow}` : `Row ${startRow}-${endRow}`;
        scArray.push(`${rowText}: ${maxStitches}sc (${maxStitches})`);
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

export default generateArmPattern;