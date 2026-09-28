import "./styles.css";
import Pattern from "./Pattern";
import MyPatterns from "./MyPatterns";
import Account from "./Account";
import Favorites from "./Favorites";
import TopNavBar from "./TopNavBar.tsx";
import React, {useState, useRef, useEffect, useCallback, lazy, Suspense} from "react";
import {v4 as uuidv4} from "uuid";
import Homepage from "./Homepage.tsx";
import {Route, Routes, Link, useNavigate} from "react-router-dom";
import {collection, getDocs, doc, updateDoc, getDoc, deleteDoc, where, query} from "firebase/firestore";
import {db, auth} from "../firebase-config.js";
import {Box, Button, CircularProgress} from "@mui/material";
import Login from "./Login.tsx";
import { signOut } from 'firebase/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useT } from './i18n/LanguageProvider';

// Editor pulls in Three.js/drei/three-csg-ts (het grootste deel van de bundel) —
// pas laden zodra de editor daadwerkelijk bezocht wordt.
const Editor = lazy(() => import("./Editor"));

export default function App() {
    const t = useT();
    const [droppedShapes, setDroppedShapes] = useState<Shape[]
        // { id: string; type: string; x: number; y: number,z: number, width: number, height: number, length:number, color: string, name: string, zoom: number, rotation_x: number, rotation_y: number, rotation_z: number }[]
    >([]);
    const [yarnInfo, setYarnInfo] = useState<Yarn>({name: null, weight: null, hooksize: null, mPerSkein: null, material: null, color: null});
    const containerRef = useRef<HTMLDivElement>(null);
    const threeJsContainerRef = useRef<HTMLDivElement>(null);
    const shapeUpdateDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const [dragging, setDragging] = useState(false);
    const [camera, setCamera] = useState(null);
    const [scene, setScene] = useState(null);

    const [activeId, setActiveId] = useState(null);
    const [shapeColor, setShapeColor] = useState('#FFFFFF');

    const [amigurumis, setAmigurumis] = useState<Amigurumi[]>([]);
    const [yarns, setYarns] = useState<Yarn[]>([]);

    const [intersections, setIntersections] = useState([]);
    const [meshes, setMeshes] = useState([]);

    const [setView, setSetView] = useState<(viewKey: string) => void>(() => () => {});

    const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
    const [showGrid, setShowGrid] = useState(false);

    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const storedAmigurumi = localStorage.getItem("amigurumi");

            // Alle drie de queries zijn onafhankelijk van elkaar (de shapes-query heeft
            // alleen storedAmigurumi nodig, niet het resultaat van de andere twee), dus
            // parallel afvuren i.p.v. na elkaar afwachten scheelt meerdere round trips.
            const [querySnapshotAmigurumi, querySnapshotYarn, querySnapshotShapes] = await Promise.all([
                getDocs(collection(db, "amigurumi")),
                getDocs(collection(db, "yarn")),
                storedAmigurumi
                    ? getDocs(query(collection(db, "shapes"), where("amigurumi_id", "==", storedAmigurumi)))
                    : Promise.resolve(null),
            ]);

            const amigurumiData: Amigurumi[] = querySnapshotAmigurumi.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            } as Amigurumi));
            setAmigurumis(amigurumiData);

            const yarnData: Yarn[] = querySnapshotYarn.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            } as Yarn));
            setYarns(yarnData);

            if (!storedAmigurumi) {
                console.warn("No amigurumi found in localStorage");
                setDroppedShapes([]);
                return;
            }

            try {
                const selectedAmigurumi = amigurumiData.find((amigurumi) => amigurumi.id === storedAmigurumi);
                if (selectedAmigurumi?.yarn_id) {
                    // Yarn zit al in de net opgehaalde yarn-collectie, dus geen aparte
                    // Firestore-call meer nodig om 'm op te zoeken.
                    const matchedYarn = yarnData.find((yarn) => yarn.id === selectedAmigurumi.yarn_id);
                    setYarnInfo(matchedYarn ?? {name: null, weight: null, mPerSkein: null, hooksize: null, color: null, material: null});
                } else {
                    setYarnInfo({name: null, weight: null, mPerSkein: null, hooksize: null, color: null, material: null});
                    console.warn("Amigurumi has no yarn_id");
                }

                const shapeData: Shape[] = (querySnapshotShapes?.docs ?? []).map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                } as Shape));
                setDroppedShapes(shapeData);
            } catch (parseError) {
                localStorage.removeItem("amigurumi");
                setDroppedShapes([]);
            }
        } catch (error) {
            console.error("Fout bij ophalen van amigurumiShape:", error);
            alert(t("errors.loadData", { message: String(error) }));
        }
    };

    useEffect(() => {
        fetchData();
        // setYarnInfo( {id: uuidv4(), name: null, weight: null, mPerSkein: null, hooksize: null, material: null, color: null});

    }, []);

    // console.log(amigurumis)
    // console.log(amigurumiShape)
    // console.log(yarns)
    // console.log(shapes)

    // useEffect(() => {
    //     const newShape1 = {
    //         id: uuidv4(),
    //         type: 'Sphere',
    //         x: 0,
    //         y: 0,
    //         z: 0,
    //         width: 200,
    //         height: 200,
    //         length: 200,
    //         color: 'yellow',
    //         name: 'Circle',
    //         rotateX: null,
    //         rotateY: null,
    //         rotateZ: null,
    //         zIndex: 10,
    //         zoom: 1,
    //     };
    //
    //     const newShape2 = {
    //         id: uuidv4(),
    //         type: 'Arm',
    //         x: 12,
    //         y: 0,
    //         z: 0,
    //         width: 200,
    //         height: 200,
    //         length: 200,
    //         color: 'hotpink',
    //         name: 'Arm',
    //         rotateX: null,
    //         rotateY: null,
    //         rotateZ: null,
    //         zIndex: 10,
    //         zoom: 1,
    //     };
    //     setDroppedShapes((prevShapes: any[]) => [...prevShapes, newShape1, newShape2]);
    //
    //     setYarnInfo( {id: uuidv4(), name: null, weight: null, mPerSkein: null, hooksize: null, material: null, color: null});
    // }, []);

    const activeShape = droppedShapes.find((shape) => shape.id === activeId);
    // const handleDragEnd = (event) => {
    //     const { over, delta } = event;
    //     if (over && containerRef.current) {
    //         if(over?.id === "trashcan"){
    //             const updatedDroppedShapes = droppedShapes.filter(shape => shape.id !== activeShape?.id);
    //             setDroppedShapes(updatedDroppedShapes);
    //         }
    //         const containerRect = containerRef.current.getBoundingClientRect();
    //             const newX = activeShape?.x + delta.x;
    //             const newY = activeShape?.y + delta.y;
    //
    //             const isOutOfBounds =
    //                 newX < 0 ||
    //                 newX + activeShape?.width > containerRect.width ||
    //                 newY < 0 ||
    //                 newY + activeShape?.height > containerRect.height;
    //
    //             if (!isOutOfBounds) {
    //                 setDroppedShapes((prevShapes) =>
    //                     prevShapes.map((shape) =>
    //                         shape.id === activeId ? { ...shape, x: newX, y: newY } : shape
    //                     )
    //                 );
    //             } else {
    //                 console.log("Vorm buiten grenzen bij verplaatsen");
    //             }
    //         }
    // };

    const persistShapeUpdate = async (updatedShape: Shape) => {
        try {
            if (!updatedShape.id) {
                throw new Error("Shape ID is required to update the document");
            }

            const shapeRef = doc(db, "shapes", updatedShape.id);

            const shapeDoc = await getDoc(shapeRef);
            if (!shapeDoc.exists()) {
                throw new Error(`No shape found with ID: ${updatedShape.id}`);
            }

            await updateDoc(shapeRef, {
                name: updatedShape.name,
                x: updatedShape.x,
                y: updatedShape.y,
                z: updatedShape.z,
                width: updatedShape.width,
                height: updatedShape.height,
                length: updatedShape.length,
                color: updatedShape.color,
                rotation_x: updatedShape.rotation_x,
                rotation_y: updatedShape.rotation_y,
                rotation_z: updatedShape.rotation_z,
                zoom: updatedShape.zoom,
            });
        } catch (error) {
            console.error("Error updating shape:", error);
            alert(t("errors.updateShape", { message: String(error) }));
        }
    };

    const handleUpdateShape = useCallback((updatedShape: Shape) => {
        setDroppedShapes((prevShapes) =>
            prevShapes.map((shape) =>
                shape.id === updatedShape.id
                    ? { ...shape, ...updatedShape }
                    : shape
            )
        );

        if (!updatedShape.id) {
            return;
        }

        const pendingTimers = shapeUpdateDebounceRef.current;
        if (pendingTimers[updatedShape.id]) {
            clearTimeout(pendingTimers[updatedShape.id]);
        }
        pendingTimers[updatedShape.id] = setTimeout(() => {
            delete pendingTimers[updatedShape.id];
            persistShapeUpdate(updatedShape);
        }, 400);
    }, []);

    useEffect(() => {
        const pendingTimers = shapeUpdateDebounceRef.current;
        return () => {
            Object.values(pendingTimers).forEach(clearTimeout);
        };
    }, []);

    const handleUpdateYarnInfo = useCallback((updatedYarnInfo: { id: string; name: string; weight: number; mPerSkein: number, hooksize: number, material: string, color: string }) => {
        setYarnInfo((prevYarnInfo: Yarn) =>
            prevYarnInfo.id === updatedYarnInfo.id
                ? { id: prevYarnInfo.id, name: updatedYarnInfo.name, weight: updatedYarnInfo.weight, mPerSkein: updatedYarnInfo.mPerSkein, hooksize: updatedYarnInfo.hooksize, material: updatedYarnInfo.material, color: updatedYarnInfo.color }
                : prevYarnInfo
        );
    }, []);

    const handleDeleteShape = useCallback(async (id: string) => {
        let previousShapes: Shape[] = [];
        try {
            if (!id || typeof id !== "string") {
                return;
            }

            setDroppedShapes((prev) => {
                previousShapes = prev;
                return prev.filter((shape) => shape.id !== id);
            });
            setActiveId((prevActiveId: any) => (prevActiveId === id ? null : prevActiveId));

            const shapeRef = doc(db, "shapes", id);
            const shapeSnap = await getDoc(shapeRef);
            if (!shapeSnap.exists()) {
                console.warn(`Shape ${id} does not exist in Firestore`);
                return;
            }
            await deleteDoc(shapeRef);
            console.log(`Shape ${id} deleted from Firestore`);
        } catch (error: any) {
            console.error("Error deleting shape from Firestore:", error, {
                code: error.code,
                message: error.message,
            });

            setDroppedShapes(previousShapes);
        }
    }, []);

    const onSetView = useCallback((setViewFn: (viewKey: string) => void) => {
        setSetView(() => setViewFn);
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Fout bij uitloggen:', error.message);
        }
    };

    return (
        <div className="App">
            <TopNavBar />
            <Box>
                <Routes>
                    <Route path={"/"} element={<Login />} />
                    <Route path="/home" element={<Homepage amigurumis={amigurumis} setAmigurumis={setAmigurumis} yarnInfo={yarnInfo} intersections={intersections} />} />
                    <Route path="/myPatterns" element={<MyPatterns amigurumis={amigurumis} setAmigurumis={setAmigurumis} yarnInfo={yarnInfo} intersections={intersections} setDroppedShapes={setDroppedShapes} />} />
                    <Route path="/favorites" element={<Favorites amigurumis={amigurumis} setAmigurumis={setAmigurumis} yarnInfo={yarnInfo} intersections={intersections} />} />
                    <Route path="/:amigurumi_id/editor" element={
                        <Suspense fallback={
                            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "92vh" }}>
                                <CircularProgress sx={{ color: 'var(--color-primary)' }} />
                            </Box>
                        }>
                            <Editor
                                droppedShapes={droppedShapes}
                                setDroppedShapes={setDroppedShapes}
                                activeId={activeId}
                                setActiveId={setActiveId}
                                activeShape={activeShape}
                                containerRef={containerRef}
                                threeJsContainerRef={threeJsContainerRef}
                                dragging={dragging}
                                setDragging={setDragging}
                                camera={camera}
                                handleUpdateShape={handleUpdateShape}
                                setCamera={setCamera}
                                handleDeleteShape={handleDeleteShape}
                                shapeColor={shapeColor}
                                setShapeColor={setShapeColor}
                                handleUpdateYarnInfo={handleUpdateYarnInfo}
                                yarnInfo={yarnInfo}
                                setYarnInfo={setYarnInfo}
                                yarns={yarns}
                                onSetView={onSetView}
                                setView={setView}
                                transformMode={transformMode}
                                setTransformMode={setTransformMode}
                                showGrid={showGrid}
                                setShowGrid={setShowGrid}
                                intersections={intersections}
                                setIntersections={setIntersections}
                                meshes={meshes}
                                setMeshes={setMeshes}
                                scene={scene}
                                setScene={setScene}
                                transFormMode={transformMode}
                            />
                        </Suspense>
                    }
                    />
                    <Route path="/:amigurumi_id/pattern" element={<Pattern shapes={droppedShapes} yarnInfo={yarnInfo} intersections={intersections} meshes={meshes} />} />
                    <Route path="/account" element={<Account />} />
                </Routes>
            </Box>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}
