import React, {useEffect, useState} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {AppBar, Button, Card, Container, Toolbar} from "@mui/material";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../firebase-config.js";
import generateSpherePattern from "./patterns/generateSpherePattern";
import generateArmPattern from "./patterns/generateArmPattern";

const Pattern = ({ shapes, yarnInfo } : {shapes: Shape[], yarn: Yarn}) => {
    const PIXELS_PER_CM = 37.8; // 10 pixels = 1 cm
    const [patterns, setPatterns] = useState<any[]>([]);
    const location = useLocation();
    const navigate = useNavigate();

    const rowHeights: Record<string, number> = {
        Lace: 0.25,
        SuperFine: 0.3,
        Fine: 0.35,
        Light: 0.4,
        Medium: 0.45,
        Bulky: 0.55,
        SuperBulky: 0.7,
        Jumbo: 1.0,
    };

    shapes = location.state.shapes;
    yarnInfo = location.state.yarnInfo;

    const isValidYarnWeight = yarnInfo.weight in rowHeights;

    const yarnWeight = isValidYarnWeight ? yarnInfo.weight : "Medium";

    console.log(yarnWeight)

    useEffect(() => {
        if (shapes && shapes.length > 0 && yarnInfo) {
            const newPatterns = shapes.map((singleShape) => {
                switch (singleShape.type) {
                    case "Sphere":
                        return generateSpherePattern(singleShape, yarnWeight, PIXELS_PER_CM, rowHeights);
                    case "Arm":
                        return generateArmPattern(singleShape, yarnWeight, PIXELS_PER_CM, rowHeights);
                    default:
                        return null;
                }
            }).filter(pattern => pattern !== null);
            setPatterns(newPatterns);
        } else {
            setPatterns([]);
        }
    }, [shapes, yarnInfo]);

    console.log(patterns)

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
                                        {pattern.type !== "Arm" ? (
                                            <>
                                                <li>Row {pattern.rowArray.length - 1}: 6dec (6)</li>
                                                <li>Sew closed</li>
                                            </>
                                        ) : null}

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
                        <Button
                            variant="contained"
                            color="inherit"
                            style={{ position: "sticky", marginLeft: 20, backgroundColor: "#F2F3AE", color: "black" }}
                            onClick={() => {navigate(-1)}}
                        >
                            Go back
                        </Button>
                </div>
            </div>
        </div>
    );
};

export default Pattern;
