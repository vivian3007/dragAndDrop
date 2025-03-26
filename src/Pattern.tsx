import React from "react";
import { useState, useEffect } from "react";
import {Link} from "react-router-dom";
import {Button} from "@mui/material";

interface Shape {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    name: string;
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
            incArray.push(`Row ${rowArray[i + 1]}: 1inc, ${i}sc`);
        }

        for (let i = incRows; i < incRows + scRows; i++) {
            scArray.push(`Row ${rowArray[i]}: ${incRows * 6}sc`);
        }

        for (let i = incRows - 2; i > 0; i--) {
            decArray.push(`Row ${rowArray[rows - i - 1]}: 1dec, ${i}sc`);
        }

        return {
            type: singleShape.type,
            color: singleShape.color,
            name: singleShape.name,
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
        <div className="pattern-container">
            {patterns.length > 0 ? (
                patterns.map((pattern, index) => (
                    <div key={index} className="pattern-text-container">
                        <h1>Pattern voor {pattern.name}</h1>
                        <p>Selected Shape: {pattern.type}</p>
                        <ul>
                            <li>Row 1: 6sc in a magic ring</li>
                            <li>Row 2: 6inc</li>
                            {pattern.incArray.map((row, idx) => (
                                <li key={idx}>{row}</li>
                            ))}
                            {pattern.scArray.map((row, idx) => (
                                <li key={idx}>{row}</li>
                            ))}
                            {pattern.decArray.map((row, idx) => (
                                <li key={idx}>{row}</li>
                            ))}
                            <li>Row {pattern.rows}: 6dec</li>
                        </ul>
                        <div
                            className={`shape ${pattern.type}`}
                            style={{ backgroundColor: pattern.color }}
                        ></div>
                    </div>
                ))
            ) : (
                <p>Geen shapes geselecteerd</p>
            )}
            <Link to="/"><Button variant="contained" color="primary">Go back</Button></Link>
        </div>
    );
};

export default Pattern;
