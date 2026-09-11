import React, {useEffect, useState} from "react";
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import {AppBar, Button, Card, Container, Toolbar} from "@mui/material";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../firebase-config.js";
import generateSpherePattern from "./patterns/generateSpherePattern";
import generateArmPattern from "./patterns/generateArmPattern";
import PatternPreview3D from "./PatternPreview3D.tsx";

const Pattern = ({ shapes, yarnInfo, intersections, meshes } : {shapes: Shape[], yarn: Yarn, intersections: any, meshes: any}) => {
    const PIXELS_PER_CM = 37.8; // 10 pixels = 1 cm
    const [patterns, setPatterns] = useState<any[]>([]);
    const location = useLocation();
    const navigate = useNavigate();
    const { amigurumi_id } = useParams();

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

    shapes = location.state?.shapes ?? [];
    yarnInfo = location.state?.yarnInfo ?? null;
    intersections = location.state?.intersections;
    const amigurumi = location.state?.amigurumi ?? null;

    const isValidYarnWeight = !!yarnInfo && yarnInfo.weight in rowHeights;

    const yarnWeight = isValidYarnWeight ? yarnInfo.weight : "Medium";

    useEffect(() => {
        if (shapes && shapes.length > 0) {
            const newPatterns = shapes.map((singleShape) => {
                // singleShape.width *= singleShape.zoom;
                // singleShape.height *= singleShape.zoom;
                // singleShape.length *= singleShape.zoom;
                switch (singleShape.type) {
                    case "Sphere":
                        return generateSpherePattern(singleShape, yarnWeight, PIXELS_PER_CM, rowHeights, intersections, shapes);
                    case "Arm":
                        return generateArmPattern(singleShape, yarnWeight, PIXELS_PER_CM, rowHeights, intersections, shapes);
                    default:
                        return null;
                }
            }).filter(pattern => pattern !== null);
            setPatterns(newPatterns);
        } else {
            setPatterns([]);
        }
    }, [shapes, yarnInfo]);

    console.log(patterns);
    console.log(intersections);

    return (
        <div>
            <div className="pattern">
                <div className="pattern-preview-panel">
                    <h1 className="pattern-page-title">{amigurumi?.name ?? "Patroon"}</h1>
                    <div className="pattern-preview-3d">
                        <PatternPreview3D shapes={shapes} />
                    </div>
                    <Button
                        variant="contained"
                        color="inherit"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-bg)" }}
                        onClick={() => {
                            // navigate(-1, {state}) roept enkel history.go(-1) aan — react-router
                            // negeert de meegegeven state dan volledig en herstelt de *oorspronkelijke*
                            // editor-locatie-state van vóór deze sessie, met eventueel inmiddels
                            // verwijderde shapes erin. Expliciet terugnavigeren met de actuele shapes
                            // voorkomt dat verwijderde shapes na het teruggaan weer verschijnen.
                            // Let op: `meshes` bevat rauwe THREE.Mesh-objecten en kan niet via
                            // history-state geserialiseerd worden (Editor.tsx leest dit ook niet
                            // uit location.state, dus het hoort hier niet bij).
                            navigate(`/${amigurumi_id}/editor`, {
                                replace: true,
                                state: { shapes, intersections },
                            });
                        }}
                    >
                        Go back
                    </Button>
                </div>
                <div className="pattern-container">
                    <Card className="pattern-text-container pattern-card--legend">
                        <h2 className="pattern-card-title">Stitch abbreviations</h2>
                        <dl className="pattern-legend-grid">
                            <dt>st</dt><dd>stitch</dd>
                            <dt>sl</dt><dd>slip stitch</dd>
                            <dt>sc</dt><dd>single crochet</dd>
                            <dt>inc</dt><dd>increase (2 single crochet in 1 stitch)</dd>
                            <dt>dec</dt><dd>decrease (single crochet 2 stitches together)</dd>
                        </dl>
                    </Card>
                    {patterns.length > 0 ? (
                        patterns.map((pattern, index) => {
                            const maxDimension = 180;
                            const aspectRatio = pattern.width / pattern.height;
                            let scaledWidth = pattern.width;
                            let scaledHeight = pattern.height;

                            if (scaledWidth > maxDimension || scaledHeight > maxDimension) {
                                if (scaledWidth > scaledHeight) {
                                    scaledWidth = maxDimension;
                                    scaledHeight = maxDimension / aspectRatio;
                                } else {
                                    scaledHeight = maxDimension;
                                    scaledWidth = maxDimension * aspectRatio;
                                }
                            }

                            return (
                                <Card
                                    key={index}
                                    className="pattern-text-container pattern-card--shape"
                                    style={{ borderLeftColor: pattern.color }}
                                >
                                    <h2 className="pattern-card-title">
                                        <span className="pattern-step-badge">{index + 1}</span>
                                        Pattern for - {pattern.name ?? "give this part a name"}
                                    </h2>
                                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                                        <ul className="pattern-row-list">
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
                                                width: `${scaledWidth}px`,
                                                height: `${scaledHeight}px`,
                                            }}
                                        ></div>
                                    </div>
                                </Card>
                            );
                        })
                    ) : (
                        <p>Geen shapes geselecteerd</p>
                    )}
                    <Card className="pattern-text-container pattern-card--assembly">
                        <h2 className="pattern-card-title">Assembly</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <ul className="pattern-row-list">
                                {(() => {
                                    const allIntersectionRows = patterns.flatMap((p) => p.intersectionRows ?? []);
                                    return allIntersectionRows.length > 0 ? (
                                        allIntersectionRows.map((intersection, idx) => (
                                            <li key={idx}>
                                                Connect{' '}
                                                {shapes.find((shape) => shape.id === intersection.shapeId1)?.name ?? `Shape ${intersection.shapeId1}`}{' '}
                                                to{' '}
                                                {shapes.find((shape) => shape.id === intersection.shapeId2)?.name ?? `Shape ${intersection.shapeId2}`}{' '}
                                                between row {intersection.topRow} and {intersection.bottomRow}
                                            </li>
                                        ))
                                    ) : (
                                        <li>No intersections to assemble</li>
                                    );
                                })()}
                            </ul>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Pattern;
