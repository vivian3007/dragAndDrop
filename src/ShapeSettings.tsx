import { useEffect, useState } from "react";
import {Box, Button, FormControlLabel, Checkbox} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import Trashcan from "./Trashcan.tsx";
import Sketch from "@uiw/react-color-sketch";
import { ColorResult } from '@uiw/color-convert';

export default function Settingsbar({
                                        activeShape,
                                        onUpdateShape,
                                        onDeleteShape,
                                        shapeColor,
                                        setShapeColor,
                                        droppedShapes,
                                    }: {
    activeShape: any,
    onUpdateShape: any,
    onDeleteShape: any,
    shapeColor: string,
    setShapeColor: any,
    droppedShapes: [],
}) {
    const PIXELS_PER_CM = 37.8;
    const [width, setWidth] = useState<number | null>(null);
    const [height, setHeight] = useState<number | null>(null);
    const [length, setLength] = useState<number | null>(null);
    const [name, setName] = useState<string | null>(null);
    const [rotateX, setRotateX] = useState<number | null>(null);
    const [rotateY, setRotateY] = useState<number | null>(null);
    const [rotateZ, setRotateZ] = useState<number | null>(null);
    const [zIndex, setZIndex] = useState(10);
    const [zoom, setZoom] = useState(1);
    const [x, setX] = useState<number | null>(null);
    const [y, setY] = useState<number | null>(null);
    const [z, setZ] = useState<number | null>(null);
    const [lockAspectRatio, setLockAspectRatio] = useState(false);

    const [aspectRatio, setAspectRatio] = useState<{w: number, h: number, l: number}>({w: 1, h: 1, l: 1});

    const handleUpdate = (updates: Partial<any>) => {
        if (activeShape) {
            onUpdateShape({
                id: activeShape.id,
                ...activeShape,
                ...updates
            });
        }
    };

    useEffect(() => {
        setX(activeShape?.x);
        setY(activeShape?.y);
        setZ(activeShape?.z);
        setWidth(activeShape ? activeShape.width / PIXELS_PER_CM * activeShape.zoom : 50);
        setHeight(activeShape ? activeShape.height / PIXELS_PER_CM * activeShape.zoom : 50);
        setLength(activeShape ? activeShape.length / PIXELS_PER_CM * activeShape.zoom : 50);
        setName(activeShape?.name || null);
        setShapeColor(activeShape?.color || '#FFFFFF');
        setRotateX(activeShape?.rotation_x || 0);
        setRotateY(activeShape?.rotation_y || 0)
        setRotateZ(activeShape?.rotation_z || 0)
        setZIndex(activeShape?.zIndex || 10);
        setZoom(activeShape?.zoom || 1);

        if (activeShape) {
            setAspectRatio({
                w: activeShape.width,
                h: activeShape.height,
                l: activeShape.length
            });
        }
    }, [activeShape]);

    const getRatios = () => {
        if (!aspectRatio.w || !aspectRatio.h || !aspectRatio.l) return {wh: 1, wl: 1, hl: 1};
        return {
            wh: aspectRatio.w / aspectRatio.h,
            wl: aspectRatio.w / aspectRatio.l,
            hl: aspectRatio.h / aspectRatio.l,
        };
    };

    const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScaledX = Number(e.target.value);
        setX(newScaledX);
        // const newBaseWidth = newScaledWidth * PIXELS_PER_CM / (activeShape?.zoom || 1);
        handleUpdate({ x: newScaledX});
    };

    const handleYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScaledY = Number(e.target.value);
        setY(newScaledY);
        // const newBaseWidth = newScaledWidth * PIXELS_PER_CM / (activeShape?.zoom || 1);
        handleUpdate({ y: newScaledY });
    };

    const handleZChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScaledZ = Number(e.target.value);
        setZ(newScaledZ);
        // const newBaseWidth = newScaledWidth * PIXELS_PER_CM / (activeShape?.zoom || 1);
        handleUpdate({ z: newScaledZ });
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScaledWidth = Number(e.target.value);
        setWidth(newScaledWidth);

        if (lockAspectRatio && aspectRatio.w && aspectRatio.h && aspectRatio.l) {
            const ratioH = aspectRatio.h / aspectRatio.w;
            const ratioL = aspectRatio.l / aspectRatio.w;
            const newHeight = newScaledWidth * ratioH;
            const newLength = newScaledWidth * ratioL;
            setHeight(newHeight);
            setLength(newLength);
            handleUpdate({ width: newScaledWidth * PIXELS_PER_CM, height: newHeight * PIXELS_PER_CM, length: newLength * PIXELS_PER_CM });
        } else {
            handleUpdate({ width: newScaledWidth * PIXELS_PER_CM });
        }
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScaledHeight = Number(e.target.value);
        setHeight(newScaledHeight);

        if (lockAspectRatio && aspectRatio.w && aspectRatio.h && aspectRatio.l) {
            const ratioW = aspectRatio.w / aspectRatio.h;
            const ratioL = aspectRatio.l / aspectRatio.h;
            const newWidth = newScaledHeight * ratioW;
            const newLength = newScaledHeight * ratioL;
            setWidth(newWidth);
            setLength(newLength);
            handleUpdate({ height: newScaledHeight * PIXELS_PER_CM, width: newWidth * PIXELS_PER_CM, length: newLength * PIXELS_PER_CM });
        } else {
            handleUpdate({ height: newScaledHeight * PIXELS_PER_CM });
        }
    };

    const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScaledLength = Number(e.target.value);
        setLength(newScaledLength);

        if (lockAspectRatio && aspectRatio.w && aspectRatio.h && aspectRatio.l) {
            const ratioW = aspectRatio.w / aspectRatio.l;
            const ratioH = aspectRatio.h / aspectRatio.l;
            const newWidth = newScaledLength * ratioW;
            const newHeight = newScaledLength * ratioH;
            setWidth(newWidth);
            setHeight(newHeight);
            handleUpdate({ length: newScaledLength * PIXELS_PER_CM, width: newWidth * PIXELS_PER_CM, height: newHeight * PIXELS_PER_CM });
        } else {
            handleUpdate({ length: newScaledLength * PIXELS_PER_CM });
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        handleUpdate({ name: newName });
    };

    const handleRotateXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRotateX = Number(e.target.value);
        setRotateX(newRotateX);
        handleUpdate({ rotation_x: newRotateX });
    };

    const handleRotateYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRotateY = Number(e.target.value);
        setRotateY(newRotateY);
        handleUpdate({ rotation_y: newRotateY });
    };

    const handleRotateZChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRotateZ = Number(e.target.value);
        setRotateX(newRotateZ);
        handleUpdate({ rotation_z: newRotateZ });
    };

    const handleColorChange = (newShade: ColorResult) => {
        setShapeColor(newShade.hex);
        handleUpdate({ color: newShade.hex });
    };

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = Number(e.target.value);
        setZoom(newZoom);
        handleUpdate({ zoom: newZoom });
        setWidth(activeShape ? Math.round(activeShape.width * newZoom) : 50);
        setHeight(activeShape ? Math.round(activeShape.height * newZoom) : 50);
        setLength(activeShape ? Math.round(activeShape.length * newZoom) : 50);
    };

    const handleDeleteShape = () => {
        if (activeShape) {
            onDeleteShape(activeShape.id);
        }
    };

    const displayName = name !== null ? name : activeShape?.name ?? "";

    console.log(lockAspectRatio)

    // const handleSubmit = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (activeShape) {
    //         onUpdateShape({
    //             id: activeShape.id,
    //             width: width !== null ? width / zoom : activeShape.width,
    //             height: height !== null ? height / zoom : activeShape.height,
    //             length: length !== null ? length / zoom : activeShape.length,
    //             color: shapeColor,
    //             name: name,
    //             rotateX: Number(rotateX),
    //             rotateY: Number(rotateY),
    //             rotateZ: Number(rotateZ),
    //             zIndex: Number(zIndex),
    //             zoom: Number(zoom),
    //         });
    //     }
    // };

    return (
            <div>
                {activeShape ? (
                    <form>
                        <h1>Settings: {activeShape?.name}</h1>
                        <p>{activeShape.id}</p>
                        <div className="shape-settings-group">
                            <h3 className="shape-settings-title">General info</h3>
                            <div className="input-text">
                                <label>Name: </label>
                                <input
                                    type="text"
                                    id="part"
                                    value={displayName ?? ""}
                                    onChange={handleNameChange}
                                    required={true}
                                    placeholder="Give this part a name"
                                />
                            </div>
                        </div>
                        <div className="shape-settings-group">
                            <h3 className="shape-settings-title">Position</h3>
                            <div className="input-text">
                                <label htmlFor="x">X: </label>
                                <input
                                    type="number"
                                    id="x"
                                    value={x !== null ? Math.round(x) : ""}
                                    onChange={handleXChange}
                                    step="1"
                                    required={true}
                                    placeholder="Give this part a x"
                                />
                            </div>
                            <div className="input-text">
                                <label htmlFor="y">Y: </label>
                                <input
                                    type="number"
                                    id="y"
                                    value={y !== null ? Math.round(y) : ""}
                                    onChange={handleYChange}
                                    step="1"
                                    required={true}
                                    placeholder="Give this part a y"
                                />
                            </div>
                            <div className="input-text">
                                <label htmlFor="z">Z: </label>
                                <input
                                    type="number"
                                    id="z"
                                    value={z !== null ? Math.round(z) : ""}
                                    onChange={handleZChange}
                                    step="1"
                                    required={true}
                                    placeholder="Give this part a z"
                                />
                            </div>
                        </div>
                        <div className="shape-settings-group">
                            <h3 className="shape-settings-title">Scaling</h3>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "2px",
                                }}
                            >
                                <label
                                    htmlFor="aspect-ratio"
                                    style={{
                                        fontWeight: 500,
                                        fontSize: "1rem",
                                        color: "#333",
                                    }}
                                >
                                    Lock aspect ratio
                                </label>
                                <Checkbox
                                    id="aspect-ratio"
                                    checked={lockAspectRatio}
                                    onChange={() => setLockAspectRatio((v) => !v)}
                                    name="aspect-ratio"
                                    style={{
                                        color: "#d4929a",
                                        marginRight: 0,
                                        marginLeft: 0,
                                        padding: 0,
                                    }}
                                />
                            </div>
                            <div className="input-text">
                                <label htmlFor="width">Width (cm): </label>
                                <input
                                    type="number"
                                    id="width"
                                    value={width !== null ? Math.round(width) : ""}
                                    onChange={handleWidthChange}
                                    min="1"
                                    step="1"
                                    required={true}
                                    placeholder="Give this part a width"
                                />
                            </div>
                            <div className="input-text">
                                <label htmlFor="height">Height (cm): </label>
                                <input
                                    type="number"
                                    id="height"
                                    value={height !== null ? Math.round(height) : ""}
                                    onChange={handleHeightChange}
                                    min="1"
                                    step="1"
                                    required={true}
                                    placeholder="Give this part a height"
                                />
                            </div>
                            <div className="input-text">
                                <label htmlFor="length">Length (cm): </label>
                                <input
                                    type="number"
                                    id="length"
                                    value={length !== null ? Math.round(length) : ""}
                                    onChange={handleLengthChange}
                                    min="1"
                                    step="1"
                                    required={true}
                                    placeholder="Give this part a length"
                                />
                            </div>
                            {/*<div className="input-text">*/}
                            {/*    <label htmlFor="zoom">Scale: </label>*/}
                            {/*    <input*/}
                            {/*        type="number"*/}
                            {/*        id="zoom"*/}
                            {/*        value={Math.round(zoom * 10) / 10}*/}
                            {/*        onChange={handleZoomChange}*/}
                            {/*        min="0.1"*/}
                            {/*        step="0.1"*/}
                            {/*        placeholder="Give this part a zoom"*/}
                            {/*    />*/}
                            {/*</div>*/}
                        </div>
                        <div className="shape-settings-group">
                            <h3 className="shape-settings-title">Rotation</h3>
                            <div className="input-text">
                                <label htmlFor="rotationX">Rotation x: </label>
                                <input
                                    type="number"
                                    id="rotationX"
                                    value={rotateX !== null ? Math.round(rotateX) : ""}
                                    onChange={handleRotateXChange}
                                    min="0"
                                    step="1"
                                    // required={true}
                                    placeholder="Give this part a x rotation"
                                />
                            </div>
                            <div className="input-text">
                                <label htmlFor="rotationY">Rotation y: </label>
                                <input
                                    type="number"
                                    id="rotationY"
                                    value={rotateY !== null ? Math.round(rotateY) : ""}
                                    onChange={handleRotateYChange}
                                    min="0"
                                    step="1"
                                    // required={true}
                                    placeholder="Give this part a y rotation"
                                />
                            </div>
                            <div className="input-text">
                                <label htmlFor="rotationZ">Rotation z: </label>
                                <input
                                    type="number"
                                    id="rotationZ"
                                    value={rotateZ !== null ? Math.round(rotateZ) : ""}
                                    onChange={handleRotateZChange}
                                    min="0"
                                    step="1"
                                    // required={true}
                                    placeholder="Give this part a z rotation"
                                />
                            </div>
                        </div>
                        <div className="shape-settings-group">
                            <h3 className="shape-settings-title">Color</h3>
                            <Sketch
                                style={{marginTop: "20px", marginBottom: "20px"}}
                                color={shapeColor}
                                onChange={handleColorChange}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="contained"
                            color="inherit"
                            sx={{marginBottom: "20px", width: 1, backgroundColor: "#8c2f3f", color: "white"}}
                            onClick={handleDeleteShape}
                        >
                            Delete shape
                        </Button>
                    </form>
                    ) : (
                    <div>
                        <Box className="steps-box">
                            <h1 style={{marginLeft: "20px"}}>Follow these steps:</h1>
                            <ol className="steps">
                                <li>Go to <b>yarn settings</b> and fill in the details about your yarn</li>
                                <li><b>Drag a shape</b> from the sidebar on the left and drop it on the canvas</li>
                                <li>Modify the shape with the <b>settings</b> in the bar on the right, or with the <b>transform
                                    functions</b></li>
                                <li>When happy with your amigurumi, click on the <b>'pattern' button</b> in the sidebar
                                    on the right
                                </li>
                            </ol>
                        </Box>
                    </div>
                )}
            </div>
    );
}