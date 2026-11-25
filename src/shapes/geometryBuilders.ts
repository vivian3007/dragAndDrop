import * as THREE from "three";
import type { OutlinePoint, ProfilePoint } from "./types";
import { resampleProfile } from "./profile";

// 3D-geometrie uit de beschrijving van een vorm: een profiel rondgedraaid (bolle vormen, zie
// shapes/profile.ts) of een omtrek als dun plaatje (platte motieven, zie shapes/outline.ts).

// Profiel → draaivorm om de y-as. De punten gelijk verdeeld over de lengte, zodat de
// steektextuur (v langs het profiel) overal even groot is. three.js wil het profiel van onder
// naar boven (dan wijzen de normalen naar buiten); het profiel staat in haakvolgorde, dus zo
// nodig omgedraaid.
export function createProfileGeometry(profile: ProfilePoint[]): THREE.BufferGeometry {
    const points = resampleProfile(profile, 64);
    if (points[0].y > points[points.length - 1].y) points.reverse();
    return new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(p.r, p.y)), 48);
}

// Omtrek → een plaatje met dikte 1 (de echte dikte komt uit `height`), plat in het x/z-vlak
// van y = 0 tot 1, net als het platte rondje. De bovenkant van het motief (+y in de omtrek)
// wordt −z: zo staat het rechtop als het op een oppervlak ligt (zie geometry/attach.ts) en
// als je het neerzet (rotation_x 90°, zie de motieven in shapes/definitions/).
//
// De boven- en onderkant zijn opgebouwd uit ringen van het midden naar de rand (niet alleen
// punten op de rand, zoals een gewone three.js-vorm), zodat een kleurwissel ook midden in het
// motief kan liggen (het hart van een bloem). Dat werkt voor elke omtrek die je vanuit het
// midden in één keer ziet (hart, blaadje, bloem, ster, lapje).
const RINGS = 12;

export function createOutlineGeometry(outline: OutlinePoint[]): THREE.BufferGeometry {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const n = outline.length;
    const vertex = (x: number, y: number, z: number, nx: number, ny: number, nz: number, u: number, v: number) => {
        positions.push(x, y, z);
        normals.push(nx, ny, nz);
        uvs.push(u, v);
        return positions.length / 3 - 1;
    };

    // Loopt de omtrek linksom (positieve oppervlakte) of rechtsom? Daarvan hangt af in welke
    // volgorde de driehoeken moeten om naar buiten te wijzen.
    const area = outline.reduce((sum, p, i) => sum + p.x * outline[(i + 1) % n].y - outline[(i + 1) % n].x * p.y, 0);

    // Boven (y = 1, normaal omhoog) en onder (y = 0, normaal omlaag). Omtrek-y wordt −z.
    for (const top of [true, false]) {
        const h = top ? 1 : 0;
        const center = vertex(0, h, 0, 0, top ? 1 : -1, 0, 0.5, 0.5);
        const rings: number[][] = [];
        for (let k = 1; k <= RINGS; k++) {
            const t = k / RINGS;
            rings.push(outline.map((p) => vertex(p.x * t, h, -p.y * t, 0, top ? 1 : -1, 0, p.x * t + 0.5, p.y * t + 0.5)));
        }
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            const tri = (a: number, b: number, c: number) => (top === area < 0 ? indices.push(a, b, c) : indices.push(a, c, b));
            tri(center, rings[0][j], rings[0][i]);
            for (let k = 1; k < RINGS; k++) {
                tri(rings[k - 1][i], rings[k - 1][j], rings[k][j]);
                tri(rings[k - 1][i], rings[k][j], rings[k][i]);
            }
        }
    }

    // De rand: per stuk omtrek een rechthoekje van onder naar boven, met de normaal naar buiten.
    let along = 0;
    const perimeter = outline.reduce((sum, p, i) => sum + Math.hypot(outline[(i + 1) % n].x - p.x, outline[(i + 1) % n].y - p.y), 0);
    for (let i = 0; i < n; i++) {
        const a = outline[i];
        const b = outline[(i + 1) % n];
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        // Normaal in het omtrekvlak (rechtsom of linksom maakt niet uit: zie de controle hieronder).
        let nx = (b.y - a.y) / (length || 1);
        let ny = -(b.x - a.x) / (length || 1);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        if (nx * midX + ny * midY < 0) {
            nx = -nx;
            ny = -ny;
        }
        const u0 = along / perimeter;
        const u1 = (along + length) / perimeter;
        along += length;
        const a0 = vertex(a.x, 0, -a.y, nx, 0, -ny, u0, 0);
        const b0 = vertex(b.x, 0, -b.y, nx, 0, -ny, u1, 0);
        const a1 = vertex(a.x, 1, -a.y, nx, 0, -ny, u0, 1);
        const b1 = vertex(b.x, 1, -b.y, nx, 0, -ny, u1, 1);
        // Zo om dat de voorkant naar buiten wijst.
        const outward = new THREE.Vector3(nx, 0, -ny);
        const faceNormal = new THREE.Vector3(b.x - a.x, 0, -(b.y - a.y)).cross(new THREE.Vector3(0, 1, 0));
        if (faceNormal.dot(outward) >= 0) indices.push(a0, b0, b1, a0, b1, a1);
        else indices.push(a0, b1, b0, a0, a1, b1);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    return geometry;
}
