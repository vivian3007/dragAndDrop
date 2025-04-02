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
    width: number;
    height: number;
    color: string;
    name: string;
    rotate: number
}

interface PatternProps {
    shapes: Shape[];
}

const Pattern: React.FC<PatternProps> = ({ shapes }) => {
    const [patterns, setPatterns] = useState<any[]>([]);
    const generatePattern = (singleShape: Shape) => {
        const shapeHeight = singleShape.height;
        const shapeWidth = singleShape.width;

        const rows = shapeHeight ? shapeHeight / 10 : 0;
        const extraScRows =
            shapeHeight && shapeWidth ? (shapeHeight - shapeWidth) / 10 : 0;
        const incRows = Math.floor((rows - extraScRows) / 3);
        const decRows = incRows - 1;
        const scRows = rows - incRows - decRows;

        const rowArray = [];
        const incArray = [];
        const scArray = [];
        const decArray = [];

        for (let i = 1; i < rows + 1; i++) {
            rowArray.push(` ${i}`);
        }

        for (let i = 1; i < incRows - 1; i++) {
            incArray.push(`Row ${rowArray[i + 1]}: 1inc, ${i}sc (${12 + i * 6})`);
        }

        const maxStitches = incRows * 6;

        // for (let i = incRows; i < incRows + scRows; i++) {
        //     scArray.push(`Row ${rowArray[i]}: ${incRows * 6}sc`);
        // }

        for (let i = 1; i < 2; i++) {
            if((incRows + scRows) - (incRows + 1) === 1) {
                scArray.push(`Row ${incRows + 1}: ${incRows * 6}sc (${maxStitches})`);
            } else {
                scArray.push(`Row ${incRows + 1} - ${incRows + scRows}: ${incRows * 6}sc (${maxStitches})`);
            }
        }

        let currentStitches = maxStitches;

        for (let i = incRows - 2; i > 0; i--) {
            currentStitches -= 6;
            decArray.push(`Row ${rowArray[rows - i - 1]}: 1dec, ${i}sc (${currentStitches})`);
        }

        return {
            type: singleShape.type,
            color: singleShape.color,
            name: singleShape.name,
            width: singleShape.width,
            height: singleShape.height,
            rotate: singleShape.rotate,
            rows,
            incArray,
            scArray,
            decArray,
        };
    }

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
                        <div style={{display: "flex", justifyContent: "space-between"}}>
                        <ul style={{lineHeight: 2}}>
                            <li>Row 1: 6sc in a magic ring (6)</li>
                            <li>Row 2: 6inc (12)</li>
                            {pattern.incArray.map((row, idx) => (
                                <li key={idx}>{row}</li>
                            ))}
                            {pattern.scArray.map((row, idx) => (
                                <li key={idx}>{row}</li>
                            ))}
                            {pattern.decArray.map((row, idx) => (
                                <li key={idx}>{row}</li>
                            ))}
                            <li>Row {pattern.rows}: 6dec (6)</li>
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
            <Link to="/"><Button variant="contained" color="primary" style={{position: "sticky", marginLeft: 20}}>Go back</Button></Link>
        </div>
    </div>
    );
};

export default Pattern;
