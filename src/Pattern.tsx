import React from "react";
import { useState, useEffect } from "react";
import {Link} from "react-router-dom";
import {Button, Card} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface Shape {
    id: string;
    type: string;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    length: number
    color: string;
    name: string;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    zIndex: number;
}

interface PatternProps {
    shapes: Shape[];
}

const Pattern: React.FC<PatternProps> = ({ shapes }) => {
    const [patterns, setPatterns] = useState<any[]>([]);
    const generatePattern = (singleShape: Shape) => {
        const shapeHeight = singleShape.width > singleShape.height ? singleShape.width : singleShape.height;
        const shapeWidth = singleShape.width > singleShape.height ? singleShape.height : singleShape.width;

        const rows = shapeHeight ? shapeHeight / 10 : 0;
        const extraScRows = shapeHeight && shapeWidth ? (shapeHeight - shapeWidth) / 10 : 0;
        const incRows = Math.floor((rows - extraScRows) / 3);
        const decRows = Math.floor(incRows - 1);
        const scRows = Math.floor(rows - incRows - decRows);

        const rowArray = [];
        const incArray = [];
        const scArray = [];
        const decArray = [];

        for (let i = 1; i < rows + 1; i++) {
            rowArray.push(i);
        }

        console.log(rowArray);

        for (let i = 1; i < incRows; i++) {
            incArray.push(`Row ${rowArray[i + 1]}: 1inc, ${i}sc (${12 + i * 6})`);
        }

        const maxStitches = incRows * 6;

        // for (let i = incRows; i < incRows + scRows; i++) {
        //     scArray.push(`Row ${rowArray[i]}: ${incRows * 6}sc`);
        // }

        if (scRows > 0) {
            const startRow = incRows + 2;
            const endRow = incRows + scRows;
            const rowText = scRows === 1 ? `Row ${startRow}` : `Row ${startRow}-${endRow}`;
            scArray.push(`${rowText}: ${maxStitches}sc (${maxStitches})`);
        }
        console.log(scRows)

        let currentStitches = maxStitches;

        for (let i = 0; i < decRows - 1; i++) {
            currentStitches -= 6;
            const rowIndex = incRows + scRows + i;
            decArray.push(`Row ${rowArray[rowIndex]}: 1dec, ${decRows - i - 1}sc (${currentStitches})`);
        }
        console.log(singleShape.name, incArray.length);

        return {
            type: singleShape.type,
            color: singleShape.color,
            name: singleShape.name,
            width: singleShape.width,
            height: singleShape.height,
            rotateX: singleShape.rotateX,
            rotateY: singleShape.rotateY,
            rotateZ: singleShape.rotateZ,
            rows,
            incArray,
            scArray,
            decArray,
            rowArray,
        };
    }
    console.log(shapes);

    useEffect(() => {
        if (shapes && shapes.length > 0) {
            const newPatterns = shapes.map((singleShape) => generatePattern(singleShape));
            setPatterns(newPatterns);
        } else {
            setPatterns([]);
        }
    }, [shapes]);

    return (
        <div className="pattern">
            <div className="pattern-container">
                <Card className="pattern-text-container">
                    <h1 style={{marginTop: 0}}>Stitch abbreviations</h1>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                        <ul style={{lineHeight: 2}}>
                            <li>st = stitch</li>
                            <li>sl = slip stitch</li>
                            <li>sc = single crochet</li>
                            <li>inc = increase (2 single crochet in 1 stitch)</li>
                            <li>dec = decrease (single crochet 2 stitches together)</li>
                        </ul>
                    </div>
                </Card>
                {patterns.length > 0 ? (
                    patterns.map((pattern, index) => (
                        <Card key={index} className="pattern-text-container">
                            <h1 style={{marginTop: 0}}>Pattern for - {pattern.name ?? "give this part a name"}</h1>
                            {/*<p>Selected Shape: {pattern.type}</p>*/}
                            <div style={{display: "flex", justifyContent: "space-between", flexWrap: "wrap"}}>
                                <ul style={{lineHeight: 2}}>
                                    <li>Row 1: 6sc in a magic ring (6)</li>
                                    {pattern.incArray.length > 0 ? (
                                        <li>Row 2: 6inc (12)</li>
                                    ) : null}
                                    {pattern.incArray.map((row, idx) => (
                                        <li key={idx}>{row}</li>
                                    ))}
                                    {pattern.scArray.map((row, idx) => (
                                        <li key={idx}>{row}</li>
                                    ))}
                                    {pattern.decArray.map((row, idx) => (
                                        <li key={idx}>{row}</li>
                                    ))}
                                    <li>Row {pattern.rowArray.length}: 6dec (6)</li>
                                    <li>Sew closed</li>
                                </ul>
                                <div
                                    className={`shape ${pattern.type}`}
                                    style={{ backgroundColor: pattern.color, width: pattern.width, height: pattern.height,
                                        // transform: `rotate(${pattern.rotate}deg)`
                                }}
                                ></div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <p>Geen shapes geselecteerd</p>
                )}

            </div>
            <div className="pattern-image">
                <Link to="/"><Button variant="contained" color="inherit" style={{position: "sticky", marginLeft: 20, backgroundColor: "#F2F3AE", color: "black"}}>Go back</Button></Link>
            </div>
        </div>
    );
};

export default Pattern;
