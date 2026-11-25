import type { PatternRow, PatternTerms } from "../patterns/patternTerms";
import type { Point } from "../geometry/shapeSpace";

// Eén punt van een profiel (bolle vormen): straal r (0..0,5) op hoogte y (0..1), in de
// volgorde waarin je haakt (ronde 1 eerst).
export type ProfilePoint = { r: number; y: number };

// Eén punt van een omtrek (platte motieven), in een vak van −0,5..0,5; +y is boven.
export type OutlinePoint = { x: number; y: number };

// Eén vormtype, compleet: alles wat de rest van de app over deze vorm moet weten staat hier,
// in één bestand per vorm (zie registry.ts). Wie een vorm toevoegt, maakt zo'n definitie en
// zet hem in de lijst; een test (shapeTypes.test.ts) controleert dat alles klopt.
//
// Bewust zonder three.js: de patroonpagina en de afmetingen gebruiken dit ook. De
// 3D-geometrie staat apart in shapes/geometry3d.ts.

// De eigen (ongeschaalde) ruimte van de 3D-vorm:
// - "sphere": een bol met straal 1 rond de oorsprong (bol, open bol, oog). Een bol is in de
//   opslag-eenheden dus 2× z'n width breed (zie geometry/units.ts).
// - "solid": diameter 1, van y = 0 (de oorsprong, in het midden van de onderkant) tot y = 1.
// - "arm": de oude arm, een cilinder (y 0..1) met een halve bol erop (zie armGeometry.ts).
export type ShapeSpace = "sphere" | "solid" | "arm";

// Hoe "Aansluiten" de vorm tegen een andere zet (zie geometry/attach.ts):
// - "ball": met z'n ronding, een stukje erin gezakt (bol, hoofd, snuit, oog);
// - "limb": met de onderkant (de oorsprong) op het oppervlak, haaks erop (arm, kegel, oor);
// - "openSphere": de opening tegen het oppervlak;
// - "embroidery": plat óp het oppervlak, rechtop (−z naar boven);
// - "applique": een plat motief (hart, bloem): plat op het oppervlak zoals een borduursel,
//   maar met de onderkant erin gezakt zoals een "limb".
export type AttachMode = "ball" | "limb" | "openSphere" | "embroidery" | "applique";

// Welke groep in de vormenbalk.
export type ShapeCategory = "round" | "flat" | "detail";

// Extra instellingen in het vormpaneel, naast maat, draaiing en kleur.
export type ShapeSetting = "opening" | "egg" | "coneTop" | "embroidery" | "petals" | "stripes";

// Wat een patroongenerator teruggeeft (zie patterns/*). `firstRow`: een eigen ronde/rij 1 in
// plaats van de magische ring.
export type GeneratedPattern = {
    type: string;
    color: string;
    name: string | null;
    width: number;
    height: number;
    rotation_x: number;
    rotation_y: number;
    rotation_z: number;
    rows: number;
    incRows: number;
    closed: boolean;
    flat: boolean;
    lastRow: number;
    stitchCount: number;
    incArray: PatternRow[];
    scArray: PatternRow[];
    decArray: PatternRow[];
    rowArray: number[];
    intersectionRows: IntersectionRow[];
    firstRow?: PatternRow;
    topWidth?: number;
};

export type PatternGenerator = (
    shape: Shape,
    yarnWeight: string,
    rowHeights: Record<string, number>,
    intersections: Intersection[],
    t?: PatternTerms,
) => GeneratedPattern;

export interface ShapeDefinition {
    type: string;
    category: ShapeCategory;
    // In de vormenbalk? (De oude Arm niet meer: die is een halve bol met buis geworden.)
    inPalette: boolean;
    space: ShapeSpace;
    attach: AttachMode;
    // Van waaruit het oppervlak gezocht wordt bij aansluiten (eigen ruimte, op de y-as).
    centerY: number;
    // Ligt een punt (eigen, ongeschaalde ruimte) in de vorm?
    inside(shape: Shape, p: Point): boolean;
    // Waar in de haakvolgorde ligt een punt op de vorm: 0 = ronde 1, 1 = de laatste ronde.
    // Voor de kleurwissels in 3D (geometry/stripes.ts) en de plek van ogen en borduursels.
    crochetFraction(shape: Shape, p: Point): number;
    // Het patroon, of null voor iets dat geen eigen onderdeel is (oog, borduursel).
    pattern: PatternGenerator | null;
    // Hoeveel steekfoto's rond (`around`) en langs de vorm (`along`), in cm (geometry/yarnLook.ts).
    yarnSize(shape: Shape, cm: { width: number; height: number; length: number; diameter: number }): { around: number; along: number };
    // Alles waar de 3D-geometrie (en de kleurwissels erop) van afhangt, behalve kleur en
    // kleurwissels zelf. Verandert dit, dan wordt de geometrie opnieuw opgebouwd.
    geometryKey?(shape: Shape): unknown;
    // Extra waarden voor een nieuwe vorm uit de vormenbalk. `size` is de maat van het vormpje
    // in de balk (in opslag-eenheden).
    dropDefaults?(size: { width: number; height: number }): Partial<Shape>;
    settings: ShapeSetting[];
    // Pictogram in de vormenbalk en op de patroonpagina: een SVG-pad in een vak van 100 × 100.
    // Zonder pad tekent styles.css het (de oude vormen, met de klassenaam = het vormtype).
    icon?: string;
    // Optioneel: de lijnen van het pictogram apart, als de vorm een open kant heeft. `iconStroke`
    // is de doorgetrokken omtrek, `iconOpen` de open kant(en), gestippeld getekend zoals bij de
    // open bol en de open buis. `icon` blijft de dichte vorm (voor de vulling).
    iconStroke?: string;
    iconOpen?: string;
    // Hoe je het onderdeel afmaakt (vertaalsleutel), als het niet dicht is. Zonder: afhechten
    // voor een plat onderdeel, anders licht vullen.
    finishKey?: string;
    // Haaksteken die het patroon gebruikt naast vaste/meerderen/minderen (voor de afkortingen).
    extraStitches?: ("ch" | "slst" | "hdc" | "dc" | "tr")[];
    // Een oog of borduursel: geen eigen onderdeel, maar iets óp een onderdeel.
    decoration?: boolean;
    // Mag een andere vorm hierop aansluiten? (Niet op een borduursel.)
    canHold?: boolean;
    // Zie je de vorm ook van binnen (open aan een kant)? Dan in 3D van twee kanten tekenen.
    doubleSided?(shape: Shape): boolean;
    // Een bolle vorm als profiel (zie shapes/profile.ts): de 3D-vorm is dat profiel
    // rondgedraaid. Een plat motief als omtrek (zie shapes/outline.ts): de 3D-vorm is die omtrek
    // als dun plaatje. Vormen met een eigen 3D-vorm (bol, cilinder, ...) hebben geen van beide.
    profile?(shape: Shape): ProfilePoint[];
    outline?(shape: Shape): OutlinePoint[];
}
