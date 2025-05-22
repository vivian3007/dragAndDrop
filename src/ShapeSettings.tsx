import { useEffect, useState } from "react";
import { Button } from "@mui/material";
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
    const PIXELS_PER_CM = 37.8; // 10 pixels = 1 cm
    const [width, setWidth] = useState<number | null>(null);
    const [height, setHeight] = useState<number | null>(null);
    const [length, setLength] = useState<number | null>(null);
    const [name, setName] = useState<string | null>(null);
    const [rotateX, setRotateX] = useState<number | null>(null);
    const [rotateY, setRotateY] = useState<number | null>(null);
    const [rotateZ, setRotateZ] = useState<number | null>(null);
    const [zIndex, setZIndex] = useState(10);
    const [zoom, setZoom] = useState(1);

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
        setWidth(activeShape ? activeShape.width / PIXELS_PER_CM * activeShape.zoom : 50);
        setHeight(activeShape ? activeShape.height / PIXELS_PER_CM * activeShape.zoom : 50);
        setLength(activeShape ? activeShape.length / PIXELS_PER_CM * activeShape.zoom : 50);
        setName(activeShape?.name || null);
        setShapeColor(activeShape?.color || '#FFFFFF');
        setRotateX(activeShape?.rotateX || 0);
        setRotateY(activeShape?.rotateY || 0)
        setRotateZ(activeShape?.rotateZ || 0)
        setZIndex(activeShape?.zIndex || 10);
        setZoom(activeShape?.zoom || 1);
    }, [activeShape]);

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScaledWidth = Number(e.target.value);
        setWidth(newScaledWidth);
        // const newBaseWidth = newScaledWidth * PIXELS_PER_CM / (activeShape?.zoom || 1);
        handleUpdate({ width: newScaledWidth * PIXELS_PER_CM});
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScaledHeight = Number(e.target.value);
        setHeight(newScaledHeight);
        const newBaseHeight = newScaledHeight * PIXELS_PER_CM / (activeShape?.zoom || 1);
        handleUpdate({ height: newScaledHeight * PIXELS_PER_CM });
    };

    const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScaledLength = Number(e.target.value);
        setLength(newScaledLength);
        const newBaseLength = newScaledLength * PIXELS_PER_CM / (activeShape?.zoom || 1);
        handleUpdate({ length: newScaledLength * PIXELS_PER_CM });
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
                <h1>Settings: {activeShape?.name}</h1>
                {activeShape ? (
                    <form>
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
                        <div className="input-text">
                            <label htmlFor="zoom">Zoom: </label>
                            <input
                                type="number"
                                id="zoom"
                                value={Math.round(zoom * 10) / 10}
                                onChange={handleZoomChange}
                                min="0.1"
                                step="0.1"
                                placeholder="Give this part a zoom"
                            />
                        </div>
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
                        <Button
                            type="button"
                            variant="contained"
                            color="inherit"
                            sx={{marginBottom: "20px", width: 1, backgroundColor: "#F2F3AE"}}
                            onClick={handleDeleteShape}
                        >
                            Delete shape
                        </Button>
                        <Sketch
                            style={{marginTop: "20px", marginBottom: "20px"}}
                            color={shapeColor}
                            onChange={handleColorChange}
                        />
                    </form>
                ) : (
                    <ul>
                        <li>T: translate</li>
                        <li>S: scale</li>
                        <li>R: rotate</li>
                        <li>G: show grid</li>
                    </ul>
                )}
            </div>
    );
}