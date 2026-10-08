import {lazy, Suspense, useEffect, useState} from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {Button, Card, Skeleton} from "@mui/material";
import {collection, doc, getDoc, getDocs, query, where} from "firebase/firestore";
import {db} from "../firebase-config.js";
import { generatePattern, PatternPart } from "./patterns/generators";
import { formatRow, PatternRow } from "./patterns/patternTerms";
import { eyePlacements, eyeSupplies, isEye } from "./patterns/eyes";
import { computePatternHeightCm, computePatternWidthCm } from "./geometry/patternBounds";
import { useIntl } from "react-intl";
import { useT } from "./i18n/LanguageProvider";
import { usePatternTerms } from "./i18n/usePatternTerms";
import { ROW_HEIGHTS } from "./patterns/estimateYarn";
import { rowRanges, yarnUsage, type YarnUse } from "./patterns/yarnUsage";
import { colorName } from "./patterns/colorNames";

// three.js pas laden als de preview echt in beeld komt.
const PatternPreview3D = lazy(() => import("./PatternPreview3D.tsx"));

// Splitst "Row 3: [1inc, 2sc] * 6 (24)" in een label- en tekst-kolom, zodat de
// dubbele punten van alle rijen in de lijst netjes onder elkaar uitlijnen
// (zie .pattern-row-list in styles.css). Regels zonder ":" (bv. "Sew closed")
// krijgen de volle breedte.
// "Wissel naar …" met een kleurvakje (kleurwissels, zie patterns/colorChanges.ts).
const ColorChangeLine = ({ text, color }: { text: string; color: string }) => (
    <li className="pattern-row-line pattern-row-color">
        <span className="pattern-row-text--full">
            {text} <span className="pattern-color-swatch" style={{ backgroundColor: color }} aria-label={color} />
        </span>
    </li>
);

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

// Vaste lege arrays: `?? []` maakte elke render een nieuwe array, waardoor de useEffect op
// [shapes] eindeloos opnieuw liep (en de pagina bevroor).
const NO_SHAPES: Shape[] = [];
const NO_INTERSECTIONS: Intersection[] = [];


// Patroonpagina (/:amigurumi_id/pattern). Vanuit een overzicht of de editor komen ontwerp en
// vormen mee in de navigatie-state, zodat de pagina meteen staat; na herladen of via een
// gedeelde link haalt hij ze zelf op aan de hand van het id in de URL.
const Pattern = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { amigurumi_id: amigurumiId = "" } = useParams();
    const stateAmigurumi = (location.state?.amigurumi as Amigurumi | undefined) ?? null;
    const stateShapes = location.state?.shapes as Shape[] | undefined;

    const [amigurumi, setAmigurumi] = useState<Amigurumi | null>(stateAmigurumi);
    const [shapes, setShapes] = useState<Shape[]>(stateShapes ?? NO_SHAPES);
    const [patterns, setPatterns] = useState<PatternPart[]>([]);
    // Door PatternPreview3D uit de 3D-scene berekend; leeg zolang de preview nog laadt.
    const [computedIntersections, setComputedIntersections] = useState<Intersection[] | null>(null);
    // Het garen van dít amigurumi, via z'n yarn_id.
    const [yarnInfo, setYarnInfo] = useState<Yarn | null>(null);
    const intl = useIntl();
    const t = useT();
    const terms = usePatternTerms();

    const rowHeights = ROW_HEIGHTS;
    const intersections = computedIntersections ?? NO_INTERSECTIONS;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [designSnap, shapesSnap] = await Promise.all([
                stateAmigurumi ? null : getDoc(doc(db, "amigurumi", amigurumiId)),
                stateShapes ? null : getDocs(query(collection(db, "shapes"), where("amigurumi_id", "==", amigurumiId))),
            ]);
            if (cancelled) return;
            if (designSnap?.exists()) setAmigurumi({ id: designSnap.id, ...designSnap.data() } as Amigurumi);
            if (shapesSnap) setShapes(shapesSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Shape));
        })().catch((error) => console.error("Fout bij ophalen van het patroon:", error));
        return () => {
            cancelled = true;
        };
    // Alleen opnieuw bij een ander ontwerp; de navigatie-state hoort bij dat moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amigurumiId]);

    useEffect(() => {
        if (!amigurumi?.yarn_id) {
            return;
        }
        getDoc(doc(db, "yarn", amigurumi.yarn_id))
            .then((snap) => {
                if (snap.exists()) {
                    setYarnInfo(snap.data() as Yarn);
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
    const yarnWeightDisplay = (isValidYarnWeight && yarnInfo?.weight) || "Medium";

    useEffect(() => {
        if (shapes && shapes.length > 0) {
            const newPatterns = shapes
                .map((singleShape) => generatePattern(singleShape, yarnWeight, rowHeights, intersections, terms))
                .filter((pattern): pattern is PatternPart => pattern !== null);
            setPatterns(newPatterns);
        } else {
            setPatterns([]);
        }
    }, [shapes, yarnWeight, intersections, terms]);

    // Garendikte staat als Engelse waarde in Firestore ("Super Fine"); alleen het label
    // wordt vertaald, met de ruwe waarde als terugval voor onbekende diktes.
    const weightLabel = (weight: string) =>
        intl.formatMessage({ id: `yarnWeight.${weight}`, defaultMessage: weight });

    const heightCm = computePatternHeightCm(shapes);
    const widthCm = computePatternWidthCm(shapes);

    // Garenoverzicht: per kleur de meters en waarvoor (patterns/yarnUsage.ts). Ogen zijn geen
    // garen: die staan bij de benodigdheden.
    const { colors: yarnColors, total: totalMeters } = yarnUsage(shapes, yarnInfo?.weight);
    // Elke kleur een letter (kleur A, B, …), zoals in gewone haakpatronen: in het garenoverzicht
    // en bij "Begin in"/"Wissel naar" in de patronen.
    const colorLetters = new Map(yarnColors.map(({ color }, index) => [color, String.fromCharCode(65 + index)]));
    const letterOf = (color: string) => colorLetters.get(color) ?? "?";
    const multipleColors = colorLetters.size > 1;
    const useLabel = ({ name, rows }: YarnUse) =>
        rows === null
            ? name
            : t("pattern.yarnUseRows", {
                name,
                rows: rowRanges(rows).map(([from, to]) => (from === to ? `${from}` : `${from}–${to}`)).join(", "),
            });

    // Alle regels van één onderdeel, met "wissel naar …" waar de kleur verandert. Ronde 1
    // (magische ring) en de slotronde zitten niet in de generator-uitvoer.
    const patternLines = (pattern: PatternPart): { text: string; color?: string }[] => {
        const baseColor = pattern.color ?? "#cccccc";
        const lines: { text: string; color?: string }[] = [];
        // Bij meer kleuren in het ontwerp zegt elk onderdeel met welke kleur je begint.
        let current = pattern.startColor ?? baseColor;
        if (multipleColors) {
            lines.push({ text: t("pattern.startInColor", { letter: letterOf(current) }), color: current });
        }
        lines.push({ text: `${terms.row(1)}: ${t("pattern.magicRingStart", { stitches: terms.sc(6) })} (6)` });
        const switchTo = (color: string) => {
            if (color !== current) {
                lines.push({ text: t("pattern.changeColor", { letter: letterOf(color) }), color });
                current = color;
            }
        };
        const addRows = (rows: PatternRow[]) => rows.forEach((row) => {
            switchTo(row.color ?? baseColor);
            lines.push({ text: formatRow(terms, row) });
        });
        addRows(pattern.incArray);
        addRows(pattern.scArray);
        if (pattern.closed) lines.push({ text: t("pattern.startStuffing") });
        addRows(pattern.decArray);
        if (pattern.closed) {
            switchTo(pattern.closingColor ?? baseColor);
            lines.push({ text: `${terms.row(pattern.lastRow)}: ${terms.dec(6)} (6)` });
            lines.push({ text: t("pattern.sewClosed") });
        } else {
            lines.push({ text: t(pattern.flat ? "pattern.fastenOffFlat" : "pattern.stuffLightly") });
        }
        return lines;
    };

    const yarnAmountLabel = (meters: number) => t("pattern.yarnAmount", { meters });

    return (
        <div>
            <div className="pattern">
                <div className="pattern-preview-panel">
                    <h1 className="pattern-page-title">{amigurumi?.name ?? t("pattern.defaultTitle")}</h1>
                    <div className="pattern-preview-3d">
                        <Suspense fallback={<Skeleton variant="rounded" sx={{ width: "100%", height: "100%", bgcolor: "var(--color-accent-soft)" }} />}>
                            <PatternPreview3D shapes={shapes} onIntersections={setComputedIntersections} />
                        </Suspense>
                    </div>
                    <Button
                        variant="contained"
                        color="inherit"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-bg)" }}
                        onClick={() => {
                            // Terug naar waar je vandaan kwam (editor of een overzicht). Geopend
                            // via een gedeelde link is er geen vorige pagina in de app: dan naar Home.
                            if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
                            else navigate("/home");
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
                            {/* Garen: één regel per kleur met de meters en waarvoor, en het totaal. */}
                            <h3 className="pattern-supplies-heading">{t("yarn.title")}</h3>
                            <p className="pattern-supplies-yarn">
                                {yarnInfo?.name
                                    ? [
                                        yarnInfo.name,
                                        yarnInfo.weight && weightLabel(yarnInfo.weight),
                                        yarnInfo.material && yarnInfo.material !== yarnInfo.name ? yarnInfo.material : null,
                                    ].filter(Boolean).join(", ")
                                    : t("pattern.yarnFallback", { weight: weightLabel(yarnWeightDisplay) })}
                            </p>
                            {yarnColors.length > 0 ? (
                                <table className="pattern-yarn-table">
                                    <tbody>
                                        {yarnColors.map(({ color, meters, uses }) => (
                                            <tr key={color}>
                                                <td className="pattern-yarn-swatch">
                                                    <span className="pattern-color-swatch" style={{ backgroundColor: color }} />
                                                </td>
                                                <td>
                                                    <span className="pattern-yarn-color">
                                                        {[
                                                            multipleColors ? t("pattern.colourLetter", { letter: letterOf(color) }) : null,
                                                            colorName(color, intl.locale),
                                                        ].filter(Boolean).join(" – ")}
                                                    </span>
                                                    <span className="pattern-yarn-uses">{uses.map(useLabel).join(" · ")}</span>
                                                </td>
                                                <td className="pattern-yarn-meters">{yarnAmountLabel(meters)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {multipleColors ? (
                                        <tfoot>
                                            <tr>
                                                <td />
                                                <td>{t("pattern.yarnTotal")}</td>
                                                <td className="pattern-yarn-meters">{yarnAmountLabel(totalMeters)}</td>
                                            </tr>
                                        </tfoot>
                                    ) : null}
                                </table>
                            ) : null}
                            <p className="pattern-info-muted">{t("pattern.yarnEstimateNote")}</p>

                            {/* De rest als eenvoudige boodschappenlijst. */}
                            <h3 className="pattern-supplies-heading">{t("pattern.alsoNeeded")}</h3>
                            <ul className="pattern-supplies-list">
                                <li>
                                    {yarnInfo?.hooksize
                                        ? t("pattern.hookSupply", { size: yarnInfo.hooksize })
                                        : t("pattern.hookSupplyFallback")}
                                </li>
                                {eyeSupplies(shapes).map(({ count, sizeMm }) => (
                                    <li key={sizeMm}>{t("pattern.eyesSupply", { count, size: sizeMm })}</li>
                                ))}
                                <li>{t("pattern.stuffingSupply")}</li>
                                <li>{t("pattern.toolsSupply")}</li>
                            </ul>

                            {heightCm && widthCm ? (
                                <p className="pattern-supplies-size">
                                    {t("pattern.finishedSize")}: {t("pattern.finishedSizeValue", { height: Math.round(heightCm), width: Math.round(widthCm) })}
                                </p>
                            ) : null}
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
                                    {patterns.some((pattern) => pattern.type === "Cylinder") && (
                                        <><dt>{t("pattern.abbr.backLoop")}</dt><dd>{t("pattern.abbr.backLoopMeaning")}</dd></>
                                    )}
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
                                            {patternLines(pattern).map((line, idx) =>
                                                line.color ? (
                                                    <ColorChangeLine key={idx} text={line.text} color={line.color} />
                                                ) : (
                                                    <RowLine key={idx} text={line.text} />
                                                )
                                            )}
                                        </ul>
                                        {pattern.type === "Cone" ? (
                                            // Een driehoek met rand kan niet met CSS-randen; daarom SVG.
                                            <svg
                                                className="shape-svg"
                                                width={scaledWidth}
                                                height={scaledHeight}
                                                viewBox="0 0 100 100"
                                                preserveAspectRatio="none"
                                                aria-hidden="true"
                                            >
                                                <polygon points="50,3 97,97 3,97" fill={pattern.color} stroke="var(--color-text)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                                            </svg>
                                        ) : (
                                            <div
                                                className={`shape ${pattern.type}`}
                                                style={{
                                                    backgroundColor: pattern.color,
                                                    width: `${scaledWidth}px`,
                                                    height: `${scaledHeight}px`,
                                                }}
                                            ></div>
                                        )}
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
                                // Ogen krijgen een eigen regel (tussen welke rondes, hoe ver uit elkaar).
                                const eyeIds = new Set(shapes.filter(isEye).map((shape) => shape.id));
                                const placements = eyePlacements(shapes, allIntersectionRows, rowHeights[yarnWeight] ?? rowHeights.Medium);
                                const connections = allIntersectionRows.filter((row) => !eyeIds.has(row.shapeId1) && !eyeIds.has(row.shapeId2));
                                const eyeLines = placements.map((placement) => {
                                    const other = placements.find((p) => p !== placement && p.target.id === placement.target.id);
                                    const base = t("pattern.placeEye", {
                                        eye: placement.eye.name ?? t("shapes.Eye"),
                                        part: placement.target.name ?? t(`shapes.${placement.target.type}`),
                                        from: placement.betweenRows[0],
                                        to: placement.betweenRows[1],
                                    });
                                    return placement.stitchesApart && other
                                        ? `${base}, ${t("pattern.eyeSpacing", { count: placement.stitchesApart, other: other.eye.name ?? t("shapes.Eye") })}`
                                        : base;
                                });
                                if (placements.length > 0) {
                                    eyeLines.push(t("pattern.eyesBeforeClosing"));
                                }
                                return connections.length > 0 || eyeLines.length > 0 ? (
                                    [...eyeLines.map((text, idx) => <RowLine key={`eye-${idx}`} text={text} />), ...connections.map((intersection, idx) => {
                                        const shape1 = shapes.find((shape) => shape.id === intersection.shapeId1)?.name ?? t("pattern.unknownShape", { id: intersection.shapeId1 });
                                        const shape2 = shapes.find((shape) => shape.id === intersection.shapeId2)?.name ?? t("pattern.unknownShape", { id: intersection.shapeId2 });
                                        return (
                                            <RowLine
                                                key={idx}
                                                text={t("pattern.connect", { part1: shape1, part2: shape2, top: intersection.topRow, bottom: intersection.bottomRow })}
                                            />
                                        );
                                    })]
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
