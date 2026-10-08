// Hulpjes voor de unit tests: een vorm met redelijke standaardwaarden, en de maat in cm
// omrekenen naar de eenheid waarin vormen worden opgeslagen.
import { pixelsPerCm } from "../geometry/units";

export function makeShape(overrides: Partial<Shape> = {}): Shape {
    return {
        id: "s1",
        name: "Vorm",
        type: "Sphere",
        x: 0,
        y: 0,
        z: 0,
        width: 100,
        height: 100,
        length: 100,
        color: "#ffffff",
        rotation_x: 0,
        rotation_y: 0,
        rotation_z: 0,
        zoom: 1,
        ...overrides,
    };
}

// Vorm waarvan elke as `cm` centimeter is (in echte maat, zoals in de vorminstellingen).
export function shapeOfCm(type: string, cm: { width: number; height: number; length: number }, overrides: Partial<Shape> = {}): Shape {
    const px = pixelsPerCm(type);
    return makeShape({ type, width: cm.width * px, height: cm.height * px, length: cm.length * px, ...overrides });
}
