import type { ProfilePoint, ShapeDefinition, ShapeSetting } from "./types";
import { endsClosed, insideProfile, profileFraction, profileLength, resampleProfile, startsClosed } from "./profile";
import { generateProfilePattern } from "../patterns/generateProfilePattern";
import { meshScaleOf } from "../geometry/units";

// Een complete vormdefinitie voor een bolle vorm uit alleen z'n profiel (zie profile.ts). Zo
// is een nieuwe bolle vorm één bestand met een profiel, een pictogram en een paar keuzes.
export function profileShape(options: {
    type: string;
    // Het profiel in haakvolgorde (genormaliseerd: zie normalizeProfile). Mag van de vorm
    // afhangen, maar is meestal vast.
    profile: (shape: Shape) => ProfilePoint[];
    // Pictogram (SVG-pad, 100 × 100); zonder: het silhouet van het profiel.
    icon?: string;
    centerY?: number;
    settings?: ShapeSetting[];
    finishKey?: string;
}): ShapeDefinition {
    const { type, profile } = options;
    return {
        type,
        category: "round",
        inPalette: true,
        space: "solid",
        attach: "limb",
        centerY: options.centerY ?? 0.5,
        inside: (shape, p) => insideProfile(profile(shape), p),
        crochetFraction: (shape, p) => {
            const [sx, sy, sz] = meshScaleOf(shape);
            return profileFraction(profile(shape), p, (sx + sz) / 2, sy);
        },
        pattern: (shape, weight, rowHeights, intersections, t) => generateProfilePattern(shape, profile(shape), weight, rowHeights, intersections, t),
        yarnSize: (shape, cm) => ({ around: Math.PI * cm.diameter, along: profileLength(profile(shape), cm.diameter, cm.height) }),
        // De verhouding tussen breedte en hoogte bepaalt waar de rondes liggen (kleurwissels).
        geometryKey: (shape) => meshScaleOf(shape),
        settings: options.settings ?? ["stripes"],
        icon: options.icon ?? profileIcon(profile({} as Shape)),
        ...(options.icon ? {} : profileIconLines(profile({} as Shape))),
        finishKey: options.finishKey,
        doubleSided: (shape) => {
            const points = profile(shape);
            return !startsClosed(points) || !endsClosed(points);
        },
        profile,
    };
}

// Silhouet van een profiel als SVG-pad in een vak van 100 × 100: de rechterkant van boven naar
// onder, dan gespiegeld terug.
export function profileIcon(profile: ProfilePoint[]): string {
    const points = resampleProfile(profile, 32);
    const ordered = points[0].y < points[points.length - 1].y ? [...points].reverse() : points;
    const x = (r: number, side: 1 | -1) => (50 + side * r * 92).toFixed(1);
    const y = (value: number) => (96 - value * 92).toFixed(1);
    const right = ordered.map((p) => `${x(p.r, 1)} ${y(p.y)}`);
    const left = [...ordered].reverse().map((p) => `${x(p.r, -1)} ${y(p.y)}`);
    return `M${right.join(" L")} L${left.join(" L")} Z`;
}

// De lijnen van dat silhouet, als de vorm een open kant heeft (een eind met straal > 0): de
// zijkanten doorgetrokken en de open kant apart, om gestippeld te tekenen (zie ShapeIcon.tsx).
// Dicht aan beide kanten: niets, dan tekent ShapeIcon gewoon de omtrek van `icon`.
export function profileIconLines(profile: ProfilePoint[]): { iconStroke?: string; iconOpen?: string } {
    const points = resampleProfile(profile, 32);
    const ordered = points[0].y < points[points.length - 1].y ? [...points].reverse() : points;
    const top = ordered[0];
    const bottom = ordered[ordered.length - 1];
    const OPEN = 0.01;
    if (top.r < OPEN && bottom.r < OPEN) return {};
    const x = (r: number, side: 1 | -1) => (50 + side * r * 92).toFixed(1);
    const y = (value: number) => (96 - value * 92).toFixed(1);
    const right = ordered.map((p) => `${x(p.r, 1)} ${y(p.y)}`);
    const left = ordered.map((p) => `${x(p.r, -1)} ${y(p.y)}`);
    const open: string[] = [];
    if (top.r >= OPEN) open.push(`M${x(top.r, -1)} ${y(top.y)} L${x(top.r, 1)} ${y(top.y)}`);
    if (bottom.r >= OPEN) open.push(`M${x(bottom.r, -1)} ${y(bottom.y)} L${x(bottom.r, 1)} ${y(bottom.y)}`);
    return { iconStroke: `M${right.join(" L")} M${left.join(" L")}`, iconOpen: open.join(" ") };
}
