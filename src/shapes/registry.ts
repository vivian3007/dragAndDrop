import type { ShapeDefinition } from "./types";
import { sphere } from "./definitions/sphere";
import { openSphere } from "./definitions/openSphere";
import { arm } from "./definitions/arm";
import { cylinder } from "./definitions/cylinder";
import { tube } from "./definitions/tube";
import { cone } from "./definitions/cone";
import { disc } from "./definitions/disc";
import { oval } from "./definitions/oval";
import { dome } from "./definitions/dome";
import { eye } from "./definitions/eye";
import { embroidery } from "./definitions/embroidery";
import { drop } from "./definitions/drop";
import { bottle } from "./definitions/bottle";
import { peanut } from "./definitions/peanut";
import { openPeanut } from "./definitions/openPeanut";
import { mushroomCap } from "./definitions/mushroomCap";
import { heart } from "./definitions/heart";
import { leaf } from "./definitions/leaf";
import { flower } from "./definitions/flower";
import { star } from "./definitions/star";
import { patch } from "./definitions/patch";

// Alle vormtypes, in de volgorde van de vormenbalk (per groep, zie Shapebar.tsx). Een nieuwe
// vorm: maak een definitie in shapes/definitions/ (zie types.ts voor wat erin moet), zet hem
// hier in de lijst, geef hem een 3D-vorm in shapes/geometry3d.ts en een naam, uitleg en
// kleurwissel-uitleg in de vertalingen (shapes.<type>, shapes.<type>.hint,
// stripes.direction.<type>). shapeTypes.test.ts controleert dat dat allemaal klopt.
//
// Bolle vormen met alleen een profiel (druppel, flesje, ...) en platte motieven met alleen een
// omtrek (hart, bloem, ...) zijn het makkelijkst: zie shapes/profileShape.ts en
// shapes/flatMotif.ts. Die hebben ook geen eigen 3D-vorm nodig.
export const SHAPE_DEFINITIONS: readonly ShapeDefinition[] = [
    // Bolle vormen
    sphere,
    openSphere,
    arm,
    cylinder,
    tube,
    cone,
    dome,
    drop,
    bottle,
    peanut,
    openPeanut,
    mushroomCap,
    // Platte vormen
    disc,
    oval,
    heart,
    leaf,
    flower,
    star,
    patch,
    // Details
    eye,
    embroidery,
];

const byType = new Map(SHAPE_DEFINITIONS.map((definition) => [definition.type, definition]));

// De definitie van een vormtype. Een onbekend type (bv. uit een nieuwere versie van de app)
// wordt als bol behandeld, zoals altijd al.
export function shapeDefinition(type: string | null | undefined): ShapeDefinition {
    return byType.get(type ?? "") ?? sphere;
}

export function isKnownShapeType(type: string | null | undefined): boolean {
    return byType.has(type ?? "");
}

// Heeft dit vormtype een eigen pictogram (een SVG-pad, zie ShapeIcon.tsx)? Zo niet, dan tekent
// styles.css het met de klassenaam van het type.
export function hasShapeIcon(type: string | null | undefined): boolean {
    return !!shapeDefinition(type).icon;
}
