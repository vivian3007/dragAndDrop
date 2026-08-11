import * as THREE from "three";

export interface SphereDef {
  center: THREE.Vector3; // world space
  radius: number;
}

export interface SphereSphereIntersection {
  intersects: boolean;
  circleCenter?: THREE.Vector3;   // world space
  circleRadius?: number;
  axis?: THREE.Vector3;           // genormaliseerd, sphereA.center -> sphereB.center
  distanceFromCenterA?: number;   // "a": afstand langs de as van sphereA.center tot het snijvlak
}

export function computeSphereSphereIntersection(
  sphereA: SphereDef,
  sphereB: SphereDef
): SphereSphereIntersection {
  const delta = sphereB.center.clone().sub(sphereA.center);
  const d = delta.length();

  if (d === 0) return { intersects: false }; // concentrisch — geen eenduidige cirkel
  if (d > sphereA.radius + sphereB.radius) return { intersects: false }; // gescheiden
  if (d < Math.abs(sphereA.radius - sphereB.radius)) return { intersects: false }; // de een bevat de ander volledig

  const axis = delta.divideScalar(d);
  const a = (d * d - sphereB.radius * sphereB.radius + sphereA.radius * sphereA.radius) / (2 * d);
  const circleRadius = Math.sqrt(Math.max(0, sphereA.radius * sphereA.radius - a * a));
  const circleCenter = sphereA.center.clone().addScaledVector(axis, a);

  return { intersects: true, circleCenter, circleRadius, axis, distanceFromCenterA: a };
}
