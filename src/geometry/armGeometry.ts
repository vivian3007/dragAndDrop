// Arm.tsx bouwt de Arm op als: een cilinder-lichaam (lokale ruimte y: 0..1, dus lokale
// hoogte 1) met een bolvormig kapje (lokale straal 0.5) gecentreerd op lokale y=1. Het
// kapje steekt dus 0.5 lokale eenheden uit boven de cilinder (y=1..1.5). De totale
// lokale lengte van de vorm langs de lokale Y-as, vóór enige mesh.scale, is dus
// 1 (cilinder) + 0.5 (kapje) = 1.5.
//
// Elke conversie tussen "lokale Y-eenheden" en "wereld/zichtbare lengte" voor de Arm
// moet met deze constante rekenen, niet met 1. Houd dit de enige bron van waarheid —
// hardcode 1.5 niet opnieuw elders.
export const ARM_TOTAL_LOCAL_LENGTH = 1.5;
