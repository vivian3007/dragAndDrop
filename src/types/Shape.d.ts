// Eén vorm in een ontwerp (collectie `shapes`).
interface Shape {
    id: string;
    // Ontwerp waar de vorm bij hoort (ontbreekt alleen op nog niet opgeslagen vormen).
    amigurumi_id?: string;
    name: string;
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
    mesh?: any;
}