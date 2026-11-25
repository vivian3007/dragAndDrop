import { shapeDefinition } from "./shapes/registry";

// Pictogram van een vorm uit z'n definitie (een SVG-pad in een vak van 100 × 100): voor de
// vormenbalk en de patroonpagina. De oudere vormen hebben geen pad; die tekent styles.css met
// de klassenaam van het vormtype (zie hasShapeIcon in shapes/registry.ts). Een open kant
// (iconOpen) wordt gestippeld, net als bij de open bol en de open buis. De lijn volgt
// `color` (currentColor), de vulling `fill`. Lijndikte 2px, gelijk aan de randen van de
// vormen die styles.css tekent, zodat alle vormen in de balk dezelfde stijl hebben.
export default function ShapeIcon({ type, fill = "#FFFFFF", className = "shape-icon-svg" }: { type: string; fill?: string; className?: string }) {
    const { icon, iconStroke, iconOpen } = shapeDefinition(type);
    if (!icon) return null;
    const line = { stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round", vectorEffect: "non-scaling-stroke", fill: "none" } as const;
    return (
        <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
            {iconStroke ? (
                // Met een open kant: vulling, doorgetrokken zijkanten en een gestippelde opening.
                <>
                    <path d={icon} fill={fill} stroke="none" />
                    <path d={iconStroke} {...line} />
                    {iconOpen && <path d={iconOpen} {...line} strokeDasharray="4 3" strokeLinecap="butt" />}
                </>
            ) : (
                <path d={icon} fill={fill} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            )}
        </svg>
    );
}
