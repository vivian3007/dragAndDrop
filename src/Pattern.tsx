import React, {useEffect, useState} from "react";
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import {AppBar, Button, Card, Container, Toolbar} from "@mui/material";
import {collection, doc, getDoc, getDocs} from "firebase/firestore";
import {db} from "../firebase-config.js";
import generateSpherePattern from "./patterns/generateSpherePattern";
import generateArmPattern from "./patterns/generateArmPattern";
import PatternPreview3D from "./PatternPreview3D.tsx";
import { computePatternHeightCm, computePatternWidthCm } from "./geometry/patternBounds";
import { useIntl } from "react-intl";
import { useT } from "./i18n/LanguageProvider";
import { usePatternTerms } from "./i18n/usePatternTerms";
import { estimateYarnMeters, skeinsNeeded } from "./patterns/estimateYarn";

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

// Vaste lege array: `?? []` maakte elke render een nieuwe array, waardoor de useEffect op
// [shapes] eindeloos opnieuw liep (en de pagina bevroor) als er geen navigatie-state was.
const NO_SHAPES: Shape[] = [];

const Pattern = ({ shapes, yarnInfo, intersections, meshes } : {shapes: Shape[], yarn: Yarn, intersections: any, meshes: any}) => {
    const PIXELS_PER_CM = 37.8; // 10 pixels = 1 cm
    const [patterns, setPatterns] = useState<any[]>([]);
    // Door PatternPreview3D uit de 3D-scene berekend; null zolang de preview nog laadt.
    const [computedIntersections, setComputedIntersections] = useState<any[] | null>(null);
    // Het garen van dít amigurumi. De yarnInfo in de navigatie-state komt vanuit Home/My
    // patterns/Favorites uit de App-state en kan bij een ander amigurumi horen (zelfde
    // probleem als de intersections), dus we halen het hier zelf op via yarn_id.
    const [fetchedYarn, setFetchedYarn] = useState<Yarn | null>(null);
    const intl = useIntl();
    const t = useT();
    const terms = usePatternTerms();
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

    shapes = location.state?.shapes ?? NO_SHAPES;
    const amigurumi = location.state?.amigurumi ?? null;
    yarnInfo = fetchedYarn ?? location.state?.yarnInfo ?? null;
    intersections = computedIntersections ?? location.state?.intersections ?? [];

    useEffect(() => {
        if (!amigurumi?.yarn_id) {
            return;
        }
        getDoc(doc(db, "yarn", amigurumi.yarn_id))
            .then((snap) => {
                if (snap.exists()) {
                    setFetchedYarn(snap.data() as Yarn);
                }
            })
            .catch((error) => console.error("Fout bij het ophalen van garen:", error));
    }, [amigurumi?.yarn_id]);

    // YarnSettings slaat diktes op zoals ze in de lijst staan ("Super Fine", "Super Bulky"),
    // terwijl rowHeights sleutels zonder spatie heeft. Zonder spaties vergelijken, anders
    // viel "Super Fine" stilletjes terug op Medium en klopten de rij-aantallen niet.
    const yarnWeightKey = yarnInfo?.weight?.replace(/\s+/g, "") ?? "";
    const isValidYarnWeight = yarnWeightKey in rowHeights;

    const yarnWeight = isValidYarnWeight ? yarnWeightKey : "Medium";
    // Voor het label de waarde zoals hij in Firestore staat, want daar zijn de vertalingen op gesleuteld.
    const yarnWeightDisplay = isValidYarnWeight ? yarnInfo.weight : "Medium";

    useEffect(() => {
        if (shapes && shapes.length > 0) {
            const newPatterns = shapes.map((singleShape) => {
                // singleShape.width *= singleShape.zoom;
                // singleShape.height *= singleShape.zoom;
                // singleShape.length *= singleShape.zoom;
                switch (singleShape.type) {
                    case "Sphere":
                        return generateSpherePattern(singleShape, yarnWeight, PIXELS_PER_CM, rowHeights, intersections, shapes, terms);
                    case "Arm":
                        return generateArmPattern(singleShape, yarnWeight, PIXELS_PER_CM, rowHeights, intersections, shapes, terms);
                    default:
                        return null;
                }
            }).filter(pattern => pattern !== null);
            setPatterns(newPatterns);
        } else {
            setPatterns([]);
        }
    }, [shapes, yarnWeight, computedIntersections, terms]);

    // Garendikte staat als Engelse waarde in Firestore ("Super Fine"); alleen het label
    // wordt vertaald, met de ruwe waarde als terugval voor onbekende diktes.
    const weightLabel = (weight: string) =>
        intl.formatMessage({ id: `yarnWeight.${weight}`, defaultMessage: weight });

    const heightCm = computePatternHeightCm(shapes);
    const widthCm = computePatternWidthCm(shapes);

    // Eén regel per kleur, met de onderdelen die in die kleur gehaakt worden.
    const partsByColor = shapes.reduce<Record<string, string[]>>((acc, shape) => {
        const color = shape.color ?? "#cccccc";
        (acc[color] ??= []).push(shape.name ?? shape.type);
        return acc;
    }, {});

    // Geschatte hoeveelheid garen per kleur, op basis van het aantal steken per onderdeel.
    const metersByColor = patterns.reduce<Record<string, number>>((acc, pattern) => {
        const color = pattern.color ?? "#cccccc";
        acc[color] = (acc[color] ?? 0) + estimateYarnMeters(pattern.stitchCount ?? 0, rowHeights[yarnWeight]);
        return acc;
    }, {});
    const totalMeters = Object.values(metersByColor).reduce((sum, meters) => sum + meters, 0);
    const metersPerSkein = yarnInfo?.mPerSkein ? Number(yarnInfo.mPerSkein) : null;

    const yarnAmountLabel = (meters: number) => {
        const skeins = skeinsNeeded(meters, metersPerSkein);
        const rounded = Math.max(1, Math.ceil(meters));
        return skeins
            ? t("pattern.yarnAmountWithSkeins", { meters: rounded, skeins })
            : t("pattern.yarnAmount", { meters: rounded });
    };

    console.log(patterns);
    console.log(intersections);

    return (
        <div>
            <div className="pattern">
                <div className="pattern-preview-panel">
                    <h1 className="pattern-page-title">{amigurumi?.name ?? t("pattern.defaultTitle")}</h1>
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
                        {t("pattern.goBack")}
                    </Button>
                </div>
                <div className="pattern-container">
                    {/* Naslag vóór de instructies: materialen en afkortingen naast elkaar, zodat ze
                        samen één blok vormen en de instructiekaarten eronder direct beginnen. */}
                    <div className="pattern-reference-grid">
                        <Card className="pattern-text-container pattern-card--legend">
                            <h2 className="pattern-card-title">{t("pattern.materials")}</h2>
                            <dl className="pattern-info-list">
                                <dt>{t("yarn.title")}</dt>
                                <dd>
                                    {yarnInfo?.name ? (
                                        <>
                                            <span className="pattern-info-strong">{yarnInfo.name}</span>
                                            <span className="pattern-info-muted">
                                                {[
                                                    yarnInfo.weight && weightLabel(yarnInfo.weight),
                                                    yarnInfo.material,
                                                    yarnInfo.mPerSkein && t("pattern.perSkein", { meters: yarnInfo.mPerSkein }),
                                                ].filter(Boolean).join(" · ")}
                                            </span>
                                        </>
                                    ) : (
                                        t("pattern.yarnFallback", { weight: weightLabel(yarnWeightDisplay) })
                                    )}
                                </dd>

                                {Object.keys(partsByColor).length > 0 ? (
                                    <>
                                        <dt>{t("pattern.colours")}</dt>
                                        <dd>
                                            <ul className="pattern-color-list">
                                                {Object.entries(partsByColor).map(([color, parts]) => (
                                                    <li key={color}>
                                                        <span className="pattern-color-swatch" style={{ backgroundColor: color }} />
                                                        {parts.join(", ")}
                                                        {metersByColor[color] ? (
                                                            <span className="pattern-color-amount"> · {yarnAmountLabel(metersByColor[color])}</span>
                                                        ) : null}
                                                    </li>
                                                ))}
                                            </ul>
                                        </dd>
                                    </>
                                ) : null}

                                {totalMeters > 0 ? (
                                    <>
                                        <dt>{t("pattern.yarnNeeded")}</dt>
                                        <dd>
                                            <span className="pattern-info-strong">{yarnAmountLabel(totalMeters)}</span>
                                            <span className="pattern-info-muted">
                                                {metersPerSkein ? t("pattern.yarnEstimateNote") : t("pattern.yarnEstimateNoSkein")}
                                            </span>
                                        </dd>
                                    </>
                                ) : null}

                                <dt>{t("yarn.hooksize")}</dt>
                                <dd>
                                    {yarnInfo?.hooksize ? (
                                        <span className="pattern-info-strong">{yarnInfo.hooksize} mm</span>
                                    ) : (
                                        t("pattern.hookFallback")
                                    )}
                                </dd>

                                <dt>{t("pattern.also")}</dt>
                                <dd>{t("pattern.alsoItems")}</dd>

                                {heightCm && widthCm ? (
                                    <>
                                        <dt>{t("pattern.finishedSize")}</dt>
                                        <dd>{t("pattern.finishedSizeValue", { height: Math.round(heightCm), width: Math.round(widthCm) })}</dd>
                                    </>
                                ) : null}
                            </dl>
                        </Card>
                        <Card className="pattern-text-container pattern-card--legend">
                            <h2 className="pattern-card-title">{t("pattern.abbreviations")}</h2>
                            {/* Eén raster voor beide lijstjes, zodat de uitleg in dezelfde kolom begint. */}
                            <div className="pattern-legend-grid">
                                <dl className="pattern-legend-group">
                                    <dt>{t("pattern.abbr.st")}</dt><dd>{t("pattern.abbr.stMeaning")}</dd>
                                    <dt>{t("pattern.abbr.sc")}</dt><dd>{t("pattern.abbr.scMeaning")}</dd>
                                    <dt>{t("pattern.abbr.inc")}</dt><dd>{t("pattern.abbr.incMeaning")}</dd>
                                    <dt>{t("pattern.abbr.dec")}</dt><dd>{t("pattern.abbr.decMeaning")}</dd>
                                    <dt>{t("pattern.abbr.magicRing")}</dt><dd>{t("pattern.abbr.magicRingMeaning")}</dd>
                                </dl>
                                <h3 className="pattern-legend-subtitle">{t("pattern.howToRead")}</h3>
                                <dl className="pattern-legend-group">
                                    <dt>[{terms.inc(1)}, {terms.sc(2)}] * 6</dt><dd>{t("pattern.howToRead.repeat")}</dd>
                                    <dt>(24)</dt><dd>{t("pattern.howToRead.count")}</dd>
                                    <dt>{terms.row("4-6")}</dt><dd>{t("pattern.howToRead.range")}</dd>
                                </dl>
                            </div>
                            <p className="pattern-legend-note">{t("pattern.spiralNote")}</p>
                        </Card>
                    </div>
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
                                        {t("pattern.partTitle", { name: pattern.name ?? t("pattern.unnamedPart") })}
                                    </h2>
                                    <div className="pattern-card-body">
                                        <ul className="pattern-row-list">
                                            <RowLine text={`${terms.row(1)}: ${t("pattern.magicRingStart", { stitches: terms.sc(6) })} (6)`} />
                                            {pattern.incArray.length > 0 ? (
                                                <RowLine text={`${terms.row(2)}: ${terms.inc(6)} (12)`} />
                                            ) : null}
                                            {pattern.incArray.map((row, idx) => (
                                                <RowLine key={idx} text={row} />
                                            ))}
                                            {pattern.scArray.map((row, idx) => (
                                                <RowLine key={idx} text={row} />
                                            ))}
                                            {pattern.type !== "Arm" ? (
                                                <RowLine text={t("pattern.startStuffing")} />
                                            ) : null}
                                            {pattern.decArray.map((row, idx) => (
                                                <RowLine key={idx} text={row} />
                                            ))}
                                            {pattern.type !== "Arm" ? (
                                                <>
                                                    <RowLine text={`${terms.row(pattern.rowArray.length - 1)}: ${terms.dec(6)} (6)`} />
                                                    <RowLine text={t("pattern.sewClosed")} />
                                                </>
                                            ) : (
                                                <RowLine text={t("pattern.stuffLightly")} />
                                            )}
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
                        <p>{t("pattern.noShapes")}</p>
                    )}
                    <Card className="pattern-text-container pattern-card--assembly">
                        <h2 className="pattern-card-title">{t("pattern.assembly")}</h2>
                        <ul className="pattern-row-list">
                            {(() => {
                                const allIntersectionRows = patterns.flatMap((p) => p.intersectionRows ?? []);
                                return allIntersectionRows.length > 0 ? (
                                    allIntersectionRows.map((intersection, idx) => {
                                        const shape1 = shapes.find((shape) => shape.id === intersection.shapeId1)?.name ?? t("pattern.unknownShape", { id: intersection.shapeId1 });
                                        const shape2 = shapes.find((shape) => shape.id === intersection.shapeId2)?.name ?? t("pattern.unknownShape", { id: intersection.shapeId2 });
                                        return (
                                            <RowLine
                                                key={idx}
                                                text={t("pattern.connect", { part1: shape1, part2: shape2, top: intersection.topRow, bottom: intersection.bottomRow })}
                                            />
                                        );
                                    })
                                ) : (
                                    <RowLine text={t("pattern.noIntersections")} />
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
