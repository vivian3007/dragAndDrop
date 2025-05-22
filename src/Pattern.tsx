import React, {useEffect, useState} from "react";
import { Link } from "react-router-dom";
import {AppBar, Button, Card, Container, Toolbar} from "@mui/material";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../firebase-config.js";

interface Shape {
    id: string;
    type: string;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    length: number;
    color: string;
    name: string;
    rotation_x: number;
    rotation_y: number;
    rotation_z: number;
    zIndex: number;
}

interface Yarn {
    id: string;
    name: string;
    weight: number;
    mPerSkein: number;
    hooksize: number;
    material: string;
    color: string;
}

interface Amigurumi {
    id: string;
    name: string;
    height: number;
    tags: [];
    favorite: boolean;
    yarn_id: string;
}

interface PatternProps {
    shapes: Shape[];
    yarn: Yarn;
}

const Pattern: React.FC<PatternProps> = ({ shapes, yarn }) => {
    const PIXELS_PER_CM = 37.8; // 10 pixels = 1 cm
    const [patterns, setPatterns] = useState<any[]>([]);


    const rowHeights: Record<string, number> = {
        lace: 0.25,
        superFine: 0.3,
        fine: 0.35,
        light: 0.4,
        medium: 0.45,
        bulky: 0.55,
        superBulky: 0.7,
        jumbo: 1.0,
    };

    const generatePattern = (singleShape: Shape, yarnWeight: string) => {
        const rowHeight = rowHeights[yarnWeight] * PIXELS_PER_CM ?? 4;
        const shapeHeight = singleShape.width > singleShape.height ? singleShape.width : singleShape.height;
        const shapeWidth = singleShape.width > singleShape.height ? singleShape.height : singleShape.width;

        const rows = shapeHeight ? shapeHeight / rowHeight : 0;
        const extraScRows = shapeHeight && shapeWidth ? (shapeHeight - shapeWidth) / rowHeight : 0;
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

        for (let i = 1; i < incRows; i++) {
            incArray.push(`Row ${rowArray[i + 1]}: 1inc, ${i}sc (${12 + i * 6})`);
        }

        const maxStitches = incRows * 6;

        if (scRows > 0) {
            const startRow = incRows + 2;
            const endRow = incRows + scRows;
            const rowText = scRows === 1 ? `Row ${startRow}` : `Row ${startRow}-${endRow}`;
            scArray.push(`${rowText}: ${maxStitches}sc (${maxStitches})`);
        }

        let currentStitches = maxStitches;

        for (let i = 0; i < decRows - 1; i++) {
            currentStitches -= 6;
            const rowIndex = incRows + scRows + i;
            decArray.push(`Row ${rowArray[rowIndex]}: 1dec, ${decRows - i - 1}sc (${currentStitches})`);
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

    useEffect(() => {
        if (shapes && shapes.length > 0) {
            const newPatterns = shapes.map((singleShape) => generatePattern(singleShape, "medium"));
            setPatterns(newPatterns);
        } else {
            setPatterns([]);
        }
    }, [shapes, yarn]);

    return (
        <div>
            <div className="pattern">
                <div className="pattern-container">
                    <Card className="pattern-text-container">
                        <h1 style={{ marginTop: 0 }}>Stitch abbreviations</h1>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <ul style={{ lineHeight: 2 }}>
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
                                <h1 style={{ marginTop: 0 }}>Pattern for - {pattern.name ?? "give this part a name"}</h1>
                                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                                    <ul style={{ lineHeight: 2 }}>
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
                                        style={{
                                            backgroundColor: pattern.color,
                                            width: pattern.width,
                                            height: pattern.height,
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
                    <Link to="/editor">
                        <Button
                            variant="contained"
                            color="inherit"
                            style={{ position: "sticky", marginLeft: 20, backgroundColor: "#F2F3AE", color: "black" }}
                        >
                            Go back
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Pattern;
