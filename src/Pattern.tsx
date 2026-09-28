import React, {useEffect, useState} from "react";
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import {AppBar, Button, Card, Container, Toolbar} from "@mui/material";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../firebase-config.js";
import generateSpherePattern from "./patterns/generateSpherePattern";
import generateArmPattern from "./patterns/generateArmPattern";
import PatternPreview3D from "./PatternPreview3D.tsx";

// Splitst "Row 3: [1inc, 2sc] * 6 (24)" in een label- en tekst-kolom, zodat de
// dubbele punten van alle rijen in de lijst netjes onder elkaar uitlijnen
// (zie .pattern-row-list in styles.css). Regels zonder ":" (bv. "Sew closed")
// krijgen de volle breedte.
const RowLine = ({ text }: { text: string }) => {
    const colonIndex = text.indexOf(":");
    if (colonIndex === -1) {
        return (
            <li className="pattern-row-line">
                <span className="pattern-row-text--full">{text}</span>
            </li>
        );
    }
    return (
        <li className="pattern-row-line">
            <span className="pattern-row-label">{text.slice(0, colonIndex)}:</span>
            <span className="pattern-row-text">{text.slice(colonIndex + 1).trim()}</span>
        </li>
    );
};

const Pattern = ({ shapes, yarnInfo, intersections, meshes } : {shapes: Shape[], yarn: Yarn, intersections: any, meshes: any}) => {
    const PIXELS_PER_CM = 37.8; // 10 pixels = 1 cm
    const [patterns, setPatterns] = useState<any[]>([]);
    // Door PatternPreview3D uit de 3D-scene berekend; null zolang de preview nog laadt.
    const [computedIntersections, setComputedIntersections] = useState<any[] | null>(null);
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
    intersections = computedIntersections ?? location.state?.intersections ?? [];
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
    }, [shapes, yarnInfo, computedIntersections]);

    console.log(patterns);
    console.log(intersections);

    return (
        <div>
            <div className="pattern">
                <div className="pattern-preview-panel">
                    <h1 className="pattern-page-title">{amigurumi?.name ?? "Patroon"}</h1>
                    <div className="pattern-preview-3d">
                        <PatternPreview3D shapes={shapes} onIntersections={setComputedIntersections} />
                    </div>
                    <Button
                        variant="contained"
                        color="inherit"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-bg)" }}
                        onClick={() => {
                            // Alleen Settingsbar.tsx (de "bekijk patroon"-knop in de editor) laat
                            // `amigurumi` weg uit de navigatie-state; Home/My patterns/Favorites en
                            // de detail-dialoog geven 'm altijd mee. Dat onderscheidt of we vanuit
                            // de editor kwamen (die stale-shapes-fix hieronder nodig heeft) of vanuit
                            // een patronen-overzicht (dat gewoon opnieuw uit Firestore laadt, dus een
                            // normale terug-navigatie stuurt je daar correct naartoe).
                            if (amigurumi) {
                                navigate(-1);
                                return;
                            }

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
                                    <div className="pattern-card-body">
                                        <ul className="pattern-row-list">
                                            <RowLine text="Row 1: 6sc in a magic ring (6)" />
                                            {pattern.incArray.length > 0 ? (
                                                <RowLine text="Row 2: 6inc (12)" />
                                            ) : null}
                                            {pattern.incArray.map((row, idx) => (
                                                <RowLine key={idx} text={row} />
                                            ))}
                                            {pattern.scArray.map((row, idx) => (
                                                <RowLine key={idx} text={row} />
                                            ))}
                                            {pattern.decArray.map((row, idx) => (
                                                <RowLine key={idx} text={row} />
                                            ))}
                                            {pattern.type !== "Arm" ? (
                                                <>
                                                    <RowLine text={`Row ${pattern.rowArray.length - 1}: 6dec (6)`} />
                                                    <RowLine text="Sew closed" />
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
                        <ul className="pattern-row-list">
                            {(() => {
                                const allIntersectionRows = patterns.flatMap((p) => p.intersectionRows ?? []);
                                return allIntersectionRows.length > 0 ? (
                                    allIntersectionRows.map((intersection, idx) => {
                                        const shape1 = shapes.find((shape) => shape.id === intersection.shapeId1)?.name ?? `Shape ${intersection.shapeId1}`;
                                        const shape2 = shapes.find((shape) => shape.id === intersection.shapeId2)?.name ?? `Shape ${intersection.shapeId2}`;
                                        return (
                                            <RowLine
                                                key={idx}
                                                text={`Connect ${shape1} to ${shape2}: between row ${intersection.topRow} and ${intersection.bottomRow}`}
                                            />
                                        );
                                    })
                                ) : (
                                    <RowLine text="No intersections to assemble" />
                                );
                            })()}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Pattern;
