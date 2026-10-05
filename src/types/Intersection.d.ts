// Kruispunt tussen twee vormen, berekend in calculateIntersections.tsx en gebruikt door de
// patroongenerators om te zeggen tussen welke rondes een vorm vastgezet wordt.
interface SphereAnalyticIntersection {
    source: "sphere-analytic";
    // shape1 = het vastgemaakte (kleinere) object, shape2 = het basis-object.
    shape1: string;
    shape2: string;
    // Op de schaal -1 (onderpool) .. +1 (bovenpool) van de basis-vorm.
    axisOffsetFraction: number;
    axisRadiusFraction: number;
    [key: string]: unknown;
}

interface CsgIntersection {
    source: "csg-world-axis";
    // shape1 = de vorm waar de fracties relatief aan berekend zijn.
    shape1: string;
    shape2: string;
    axisHighFraction: number;
    axisLowFraction: number;
    [key: string]: unknown;
}

type Intersection = SphereAnalyticIntersection | CsgIntersection;

// Rondes waartussen shapeId2 aan shapeId1 vastgezet wordt.
interface IntersectionRow {
    shapeId1: string;
    shapeId2: string;
    topRow: number;
    bottomRow: number;
}
