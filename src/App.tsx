import "./styles.css";
import Pattern from "./Pattern";
import MyPatterns from "./MyPatterns";
import NewPattern from "./NewPattern";
import Editor from "./Editor";
import { useState, useRef, useEffect } from "react";
import {v4 as uuidv4} from "uuid";
import Homepage from "./Homepage.tsx";
import {Route, Routes, Link, useNavigate} from "react-router-dom";
import {collection, getDocs, doc, updateDoc, getDoc, deleteDoc, where, query, documentId} from "firebase/firestore";
import {db, auth} from "../firebase-config.js";
import {AppBar, Box, Button, Container, Toolbar} from "@mui/material";
import Login from "./Login.tsx";
import { signOut } from 'firebase/auth';

interface Amigurumi {
    name: string;
    height: number;
    tags: [];
    favorite: boolean;
    yarn_id: string;
}

interface AmigurumiShape {
    amigurumi_id: string;
    shape_id: string;
}

interface Yarn {
    name: string;
    weight: string;
    mPerSkein: number;
    hooksize: number;
    material: string;
    color: string;
}

interface Shape {
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
}

export default function App() {
    const [droppedShapes, setDroppedShapes] = useState<Shape[]
        // { id: string; type: string; x: number; y: number,z: number, width: number, height: number, length:number, color: string, name: string, zoom: number, rotation_x: number, rotation_y: number, rotation_z: number }[]
    >([]);
    const [yarnInfo, setYarnInfo] = useState<Yarn>({name: null, weight: null, hooksize: null, mPerSkein: null, material: null, color: null});
    const containerRef = useRef<HTMLDivElement>(null);
    const threeJsContainerRef = useRef<HTMLDivElement>(null);

    const [dragging, setDragging] = useState(false);
    const [camera, setCamera] = useState(null);

    const [activeId, setActiveId] = useState(null);
    const [shapeColor, setShapeColor] = useState('#FFFFFF');

    const [amigurumis, setAmigurumis] = useState<Amigurumi[]>([]);
    const [yarns, setYarns] = useState<Yarn[]>([]);
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [amigurumiShape, setAmigurumiShape] = useState<AmigurumiShape[]>([]);

    console.log("yarn:", yarnInfo);

    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const querySnapshotAmigurumi = await getDocs(collection(db, "amigurumi"));
            const amigurumiData: Amigurumi[] = querySnapshotAmigurumi.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            } as Amigurumi));
            setAmigurumis(amigurumiData);
            const querySnapshotYarn = await getDocs(collection(db, "yarn"));
            const yarnData: Yarn[] = querySnapshotYarn.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            } as Yarn));
            setYarns(yarnData);
            const storedAmigurumi = localStorage.getItem("amigurumi");
            if (storedAmigurumi) {
                try {
                    const amigurumiId: string = storedAmigurumi;
                    const selectedAmigurumi = amigurumiData.find((amigurumi) => amigurumi.id === amigurumiId);
                    if (amigurumiId) {
                        if (selectedAmigurumi.yarn_id) {
                            const yarnQuery = query(
                                collection(db, "yarn"),
                                where(documentId(), "==", selectedAmigurumi.yarn_id)
                            );
                            const querySnapshotYarn = await getDocs(yarnQuery);
                            const yarnInfo = querySnapshotYarn.docs.map((doc) => ({
                                id: doc.id,
                                ...doc.data(),
                            } as Yarn));
                            setYarnInfo(yarnInfo[0]);
                        } else {
                            setYarnInfo({name: null, weight: null, mPerSkein: null, hooksize: null, color: null, material: null})
                            console.warn("Amigurumi has no yarn_id");
                        }
                        const shapesQuery = query(
                            collection(db, "shapes"),
                            where("amigurumi_id", "==", amigurumiId)
                        );
                        const querySnapshotShapes = await getDocs(shapesQuery);
                        const shapeData: Shape[] = querySnapshotShapes.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        } as Shape));
                        setDroppedShapes(shapeData);
                    } else {
                        setDroppedShapes([]);
                    }
                } catch (parseError) {
                    localStorage.removeItem("amigurumi");
                    setDroppedShapes([]);
                }
            } else {
                console.warn("No amigurumi found in localStorage");
                setDroppedShapes([]);
            }
            const querySnapshotAmigurumiShape = await getDocs(collection(db, "amigurumi_shape"));
            const amigurumiShapeData: AmigurumiShape[] = querySnapshotAmigurumiShape.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            } as AmigurumiShape));
            setAmigurumiShape(amigurumiShapeData);
        } catch (error) {
            console.error("Fout bij ophalen van amigurumiShape:", error);
            alert("Fout bij ophalen van gegevens: " + error);
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

    const handleUpdateShape = async (updatedShape: Shape) => {
        setDroppedShapes((prevShapes) =>
            prevShapes.map((shape) =>
                shape.id === updatedShape.id
                    ? { ...shape, ...updatedShape }
                    : shape
            )
        );

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
            alert("Error updating shape: " + error);
        }
    };

    const handleUpdateYarnInfo = (updatedYarnInfo: { id: string; name: string; weight: number; mPerSkein: number, hooksize: number, material: string, color: string }) => {
        setYarnInfo(
        yarnInfo.id === updatedYarnInfo.id
            ? { id: yarnInfo.id, name: updatedYarnInfo.name, weight: updatedYarnInfo.weight, mPerSkein: updatedYarnInfo.mPerSkein, hooksize: updatedYarnInfo.hooksize, material: updatedYarnInfo.material, color: updatedYarnInfo.color }
            : yarnInfo
        );
    };

    const handleDeleteShape = async (id: string) => {
        try {
            if (!id || typeof id !== "string") {
                return;
            }

            setDroppedShapes((prev) => prev.filter((shape) => shape.id !== id));
            if (activeShape?.id === id) {
                setActiveId(null);
            }

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

            setDroppedShapes(droppedShapes);
            if (activeShape?.id === id && !droppedShapes.some((shape) => shape.id === id)) {
                setActiveId(activeShape.id);
            }
        }
    }

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
            <AppBar position={"static"} style={{ backgroundColor: "#F2F3AE", height: "8vh" }}>
                <Container maxWidth="xl" sx={{marginLeft: 0}}>
                    <Toolbar disableGutters>
                        <Link to={"/home"} className="navbar-button">Home</Link>
                        <Link to={"/myPatterns"} className="navbar-button">My patterns</Link>
                        <Link to={"/newPattern"} className="navbar-button">New pattern</Link>
                        <a
                            onClick={handleLogout}
                            className="navbar-button"
                        >
                            Uitloggen
                        </a>
                    </Toolbar>
                </Container>
            </AppBar>
            <Box>
                <Routes>
                    <Route path={"/"} element={<Login />} />
                    <Route path="/home" element={<Homepage amigurumis={amigurumis} setAmigurumis={setAmigurumis} />} />
                    <Route path="/myPatterns" element={<MyPatterns amigurumis={amigurumis} setAmigurumis={setAmigurumis} yarnInfo={yarnInfo} />} />
                    <Route path="/newPattern" element={<NewPattern amigurumis={amigurumis} setAmigurumis={setAmigurumis} setDroppedShapes={setDroppedShapes} droppedShapes={droppedShapes} />} />
                    <Route path="/:amigurumi_id/editor" element={
                        <Editor droppedShapes={droppedShapes} setDroppedShapes={setDroppedShapes} activeId={activeId} setActiveId={setActiveId} activeShape={activeShape} containerRef={containerRef} threeJsContainerRef={threeJsContainerRef} dragging={dragging} setDragging={setDragging} camera={camera} handleUpdateShape={handleUpdateShape} setCamera={setCamera} handleDeleteShape={handleDeleteShape} shapeColor={shapeColor} setShapeColor={setShapeColor} handleUpdateYarnInfo={handleUpdateYarnInfo} yarnInfo={yarnInfo} setYarnInfo={setYarnInfo} yarns={yarns} />
                    }
                    />
                    <Route path="/:amigurumi_id/pattern" element={<Pattern shapes={droppedShapes} yarnInfo={yarnInfo} />} />
                </Routes>
            </Box>
        </div>
    );
}
