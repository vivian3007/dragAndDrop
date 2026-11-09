import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControlsRef, TransformControlsRef } from "./types";
import { sizeFromMeshScale } from "../geometry/units";

type Point = { x: number; y: number };

type Gesture =
    // Eén vinger op de geselecteerde vorm: verschuiven in het vlak evenwijdig aan het scherm.
    | { kind: "move"; pointerId: number; plane: THREE.Plane; offset: THREE.Vector3; moved: boolean }
    // Twee vingers: knijpen schaalt, draaien roteert om de kijkrichting.
    | { kind: "pinch"; a: number; b: number; startDistance: number; startAngle: number;
        startScale: THREE.Vector3; startQuaternion: THREE.Quaternion };

const distance = (p: Point, q: Point) => Math.hypot(q.x - p.x, q.y - p.y);
const angle = (p: Point, q: Point) => Math.atan2(q.y - p.y, q.x - p.x);
const toDegrees = (radians: number) => radians * (180 / Math.PI);

// Aanraakgebaren op de geselecteerde vorm, omdat de pijltjes van de gizmo met een vinger
// lastig te raken zijn: slepen verplaatst, knijpen schaalt, met twee vingers draaien roteert.
// Alleen voor touch, en alleen als je óp de geselecteerde vorm begint; elders draaien en
// zoomen vingers gewoon de camera (OrbitControls), en de gizmo werkt ook nog.
//
// De listeners zitten op het <canvas> zelf. OrbitControls, TransformControls en de
// klik-afhandeling van react-three-fiber luisteren op het element eromheen, dus wij zijn
// eerder: bij een gebaar zetten we die controls even uit en laten we het event niet door.
export default function TouchGestures({ activeId, shapes, orbitControlsRef, activeTransformControlsRef, onUpdateShape, onGestureChange, onMoveEnd }: {
    activeId: string | null;
    shapes: Shape[];
    orbitControlsRef: OrbitControlsRef;
    activeTransformControlsRef: TransformControlsRef;
    onUpdateShape: (shape: Shape) => void;
    onGestureChange: (active: boolean) => void;
    // Na verschuiven: bv. vastklikken aan een vorm die hij raakt (zoals na de gizmo).
    onMoveEnd: (id: string) => void;
}) {
    const { gl, camera, scene } = useThree();
    const latest = useRef({ activeId, shapes, onUpdateShape, onGestureChange, onMoveEnd });
    latest.current = { activeId, shapes, onUpdateShape, onGestureChange, onMoveEnd };

    useEffect(() => {
        const canvas = gl.domElement;
        const pointers = new Map<number, Point>();
        const raycaster = new THREE.Raycaster();
        let gesture: Gesture | null = null;
        let suppressClick = false;

        const setRay = ({ x, y }: Point) => {
            const rect = canvas.getBoundingClientRect();
            raycaster.setFromCamera(new THREE.Vector2(
                ((x - rect.left) / rect.width) * 2 - 1,
                -((y - rect.top) / rect.height) * 2 + 1,
            ), camera);
        };

        const selectedMesh = () => {
            const id = latest.current.activeId;
            return id ? scene.getObjectByProperty("uuid", id) as THREE.Mesh | undefined : undefined;
        };

        const setControlsEnabled = (enabled: boolean) => {
            if (orbitControlsRef.current) orbitControlsRef.current.enabled = enabled;
            // `enabled` is in de typings van three-stdlib private, maar wordt in pointerDown gewoon
            // gelezen: uit = de gizmo negeert dit gebaar.
            const transformControls = activeTransformControlsRef.current as unknown as { enabled: boolean } | null;
            if (transformControls) transformControls.enabled = enabled;
        };

        const startPinch = (mesh: THREE.Mesh) => {
            const [a, b] = [...pointers.keys()];
            const pa = pointers.get(a)!;
            const pb = pointers.get(b)!;
            gesture = {
                kind: "pinch", a, b,
                startDistance: Math.max(distance(pa, pb), 1),
                startAngle: angle(pa, pb),
                startScale: mesh.scale.clone(),
                startQuaternion: mesh.quaternion.clone(),
            };
        };

        const finish = () => {
            const ended = gesture;
            gesture = null;
            suppressClick = true;
            setControlsEnabled(true);
            latest.current.onGestureChange(false);
            const id = latest.current.activeId;
            if (ended?.kind === "move" && ended.moved && id) latest.current.onMoveEnd(id);
        };

        const update = (mesh: THREE.Mesh) => {
            const shape = latest.current.shapes.find((s) => s.id === mesh.uuid);
            if (!shape) return;
            latest.current.onUpdateShape({
                ...shape,
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z,
                ...(gesture?.kind === "pinch" && {
                    ...sizeFromMeshScale({ type: shape.type, width: shape.width }, mesh.scale),
                    rotation_x: toDegrees(mesh.rotation.x),
                    rotation_y: toDegrees(mesh.rotation.y),
                    rotation_z: toDegrees(mesh.rotation.z),
                }),
            });
        };

        const handleDown = (e: PointerEvent) => {
            if (e.pointerType !== "touch") return;
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            // Tweede vinger erbij tijdens het verschuiven: overstappen op knijpen/draaien.
            if (gesture) {
                const mesh = selectedMesh();
                if (gesture.kind === "move" && pointers.size === 2 && mesh) startPinch(mesh);
                canvas.setPointerCapture(e.pointerId);
                e.stopPropagation();
                return;
            }
            if (pointers.size !== 1) return;

            const mesh = selectedMesh();
            if (!mesh) return;
            setRay({ x: e.clientX, y: e.clientY });
            if (raycaster.intersectObject(mesh, false).length === 0) return;

            const normal = camera.getWorldDirection(new THREE.Vector3());
            const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, mesh.position);
            const point = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
            if (!point) return;

            gesture = { kind: "move", pointerId: e.pointerId, plane, offset: mesh.position.clone().sub(point), moved: false };
            setControlsEnabled(false);
            latest.current.onGestureChange(true);
            canvas.setPointerCapture(e.pointerId);
            e.stopPropagation();
        };

        const handleMove = (e: PointerEvent) => {
            if (!pointers.has(e.pointerId)) return;
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (!gesture) return;
            e.stopPropagation();
            const mesh = selectedMesh();
            if (!mesh) {
                finish();
                return;
            }

            if (gesture.kind === "move") {
                if (e.pointerId !== gesture.pointerId) return;
                setRay({ x: e.clientX, y: e.clientY });
                const point = raycaster.ray.intersectPlane(gesture.plane, new THREE.Vector3());
                if (!point) return;
                mesh.position.copy(point.add(gesture.offset));
                gesture.moved = true;
            } else {
                const pa = pointers.get(gesture.a);
                const pb = pointers.get(gesture.b);
                if (!pa || !pb) return;
                mesh.scale.copy(gesture.startScale).multiplyScalar(distance(pa, pb) / gesture.startDistance);
                // Met de klok mee draaien op het scherm (y loopt omlaag) = met de klok mee
                // zoals de kijker het ziet = positief om de kijkrichting.
                const axis = camera.getWorldDirection(new THREE.Vector3());
                const twist = new THREE.Quaternion().setFromAxisAngle(axis, angle(pa, pb) - gesture.startAngle);
                mesh.quaternion.copy(gesture.startQuaternion).premultiply(twist);
            }
            update(mesh);
        };

        const handleUp = (e: PointerEvent) => {
            if (!pointers.delete(e.pointerId) || !gesture) return;
            e.stopPropagation();
            // Na knijpen niet terugvallen op verschuiven met de overgebleven vinger.
            if (gesture.kind === "pinch" || e.pointerId === gesture.pointerId) finish();
        };

        // Het loslaten na een gebaar is geen klik (anders zou bv. de selectie verspringen).
        const handleClick = (e: MouseEvent) => {
            if (!suppressClick) return;
            suppressClick = false;
            e.stopPropagation();
        };
        const resetSuppress = (e: PointerEvent) => {
            if (!gesture && pointers.size === 0 && e.pointerType === "touch") suppressClick = false;
        };

        const options = { capture: true };
        canvas.addEventListener("pointerdown", resetSuppress, options);
        canvas.addEventListener("pointerdown", handleDown, options);
        canvas.addEventListener("pointermove", handleMove, options);
        canvas.addEventListener("pointerup", handleUp, options);
        canvas.addEventListener("pointercancel", handleUp, options);
        canvas.addEventListener("click", handleClick, options);
        return () => {
            canvas.removeEventListener("pointerdown", resetSuppress, options);
            canvas.removeEventListener("pointerdown", handleDown, options);
            canvas.removeEventListener("pointermove", handleMove, options);
            canvas.removeEventListener("pointerup", handleUp, options);
            canvas.removeEventListener("pointercancel", handleUp, options);
            canvas.removeEventListener("click", handleClick, options);
            if (gesture) setControlsEnabled(true);
        };
    }, [gl, camera, scene, orbitControlsRef, activeTransformControlsRef]);

    return null;
}
