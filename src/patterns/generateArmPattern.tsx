const generateArmPattern = (singleShape: Shape, yarnWeight: string, PIXELS_PER_CM: number, rowHeights: Record<string, number>) => {
    const rowHeight = rowHeights[yarnWeight] * PIXELS_PER_CM ?? 4;
    const shapeHeight = singleShape.height;
    const shapeWidth = singleShape.width;

    const rows = shapeHeight ? shapeHeight / rowHeight + 1 : 0;
    const extraScRows = shapeHeight && shapeWidth ? (shapeHeight - shapeWidth) / rowHeight : 0;
    const incRows = Math.floor((rows - extraScRows) / 3);
    const scRows = Math.floor(rows - incRows);

    const rowArray = [];
    const incArray = [];
    const scArray = [];
    const decArray = [];

    for (let i = 1; i < rows + 1; i++) {
        rowArray.push(i);
    }

    for (let i = 1; i < incRows; i++) {
        incArray.push(`Row ${rowArray[i + 1]}: 1inc, ${i}sc (${12 + i * 6})`);
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
    };
};

export default generateArmPattern;