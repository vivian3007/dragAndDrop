// Eén vorm in een ontwerp (collectie `shapes`).
interface Shape {
    id: string;
    // Ontwerp waar de vorm bij hoort (ontbreekt alleen op nog niet opgeslagen vormen).
    amigurumi_id?: string;
    name: string | null;
    type: string;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    length: number;
    color: string;
    rotation_x: number;
    rotation_y: number;
    rotation_z: number;
    zoom: number;
    // Kleurwissels (banen in een andere kleur), zie patterns/colorChanges.ts.
    stripes?: { from: number; to: number; color: string }[] | null;
    // Alleen bol: breedte van de opening als deel van de breedste doorsnede (0/leeg = dicht),
    // zie geometry/sphereOpening.ts.
    opening?: number | null;
    // Alleen borduursel: welk detail ("mouth", "nose", "brow", "cheek") en hoe bol het oppervlak
    // eronder is (1/straal in cm), zodat het er plat op ligt. Zie patterns/embroidery.ts.
    detail?: string | null;
    curvature?: number | null;
    mesh?: unknown;
}