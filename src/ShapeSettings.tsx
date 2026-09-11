import { memo, useCallback, useEffect, useRef, useState } from "react";
import {FormControlLabel, Checkbox} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import Trashcan from "./Trashcan.tsx";
import { HexColorPicker } from "react-colorful";
import { PIXELS_PER_CM } from "./geometry/units";

const ColorPicker = memo(function ColorPicker({ color, onColorChange }: { color: string; onColorChange: (newColor: string) => void }) {
    return (
        <HexColorPicker
            style={{marginTop: "20px", marginBottom: "20px", marginLeft: "auto", marginRight: "auto", width: "180px", height: "140px"}}
            color={color}
            onChange={onColorChange}
        />
    );
});

function ShapeSettings({
                                        activeShape,
                                        onUpdateShape,
                                        shapeColor,
                                        setShapeColor,
                                        droppedShapes,
                                    }: {
    activeShape: any,
    onUpdateShape: any,
    shapeColor: string,
    setShapeColor: any,
    droppedShapes: [],
}) {
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
    const [checkboxBounce, setCheckboxBounce] = useState(false);

    const activeShapeRef = useRef(activeShape);
    activeShapeRef.current = activeShape;

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
    }, [activeShape]);

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
        const zoomFactor = activeShape?.zoom || 1;
        setWidth(newScaledWidth);

        if (lockAspectRatio && width && height && length) {
            const ratioH = height / width;
            const ratioL = length / width;
            const newHeight = newScaledWidth * ratioH;
            const newLength = newScaledWidth * ratioL;
            setHeight(newHeight);
            setLength(newLength);
            handleUpdate({
                width: newScaledWidth * PIXELS_PER_CM / zoomFactor,
                height: newHeight * PIXELS_PER_CM / zoomFactor,
                length: newLength * PIXELS_PER_CM / zoomFactor,
            });
        } else {
            handleUpdate({ width: newScaledWidth * PIXELS_PER_CM / zoomFactor });
        }
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScaledHeight = Number(e.target.value);
        const zoomFactor = activeShape?.zoom || 1;
        setHeight(newScaledHeight);

        if (lockAspectRatio && width && height && length) {
            const ratioW = width / height;
            const ratioL = length / height;
            const newWidth = newScaledHeight * ratioW;
            const newLength = newScaledHeight * ratioL;
            setWidth(newWidth);
            setLength(newLength);
            handleUpdate({
                height: newScaledHeight * PIXELS_PER_CM / zoomFactor,
                width: newWidth * PIXELS_PER_CM / zoomFactor,
                length: newLength * PIXELS_PER_CM / zoomFactor,
            });
        } else {
            handleUpdate({ height: newScaledHeight * PIXELS_PER_CM / zoomFactor });
        }
    };

    const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScaledLength = Number(e.target.value);
        const zoomFactor = activeShape?.zoom || 1;
        setLength(newScaledLength);

        if (lockAspectRatio && width && height && length) {
            const ratioW = width / length;
            const ratioH = height / length;
            const newWidth = newScaledLength * ratioW;
            const newHeight = newScaledLength * ratioH;
            setWidth(newWidth);
            setHeight(newHeight);
            handleUpdate({
                length: newScaledLength * PIXELS_PER_CM / zoomFactor,
                width: newWidth * PIXELS_PER_CM / zoomFactor,
                height: newHeight * PIXELS_PER_CM / zoomFactor,
            });
        } else {
            handleUpdate({ length: newScaledLength * PIXELS_PER_CM / zoomFactor });
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
        setRotateZ(newRotateZ);
        handleUpdate({ rotation_z: newRotateZ });
    };

    const handleColorChange = useCallback((newColor: string) => {
        setShapeColor(newColor);
        const current = activeShapeRef.current;
        if (current) {
            onUpdateShape({
                id: current.id,
                ...current,
                color: newColor
            });
        }
    }, [onUpdateShape, setShapeColor]);

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = Number(e.target.value);
        setZoom(newZoom);
        handleUpdate({ zoom: newZoom });
        setWidth(activeShape ? Math.round(activeShape.width * newZoom) : 50);
        setHeight(activeShape ? Math.round(activeShape.height * newZoom) : 50);
        setLength(activeShape ? Math.round(activeShape.length * newZoom) : 50);
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
                {activeShape ? (
                    <form>
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
                                    placeholder="Head"
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
                                    onChange={() => {
                                        setLockAspectRatio((v) => !v);
                                        setCheckboxBounce(true);
                                    }}
                                    onAnimationEnd={() => setCheckboxBounce(false)}
                                    name="aspect-ratio"
                                    className={checkboxBounce ? "checkbox-jump" : ""}
                                    style={{
                                        color: "var(--color-primary)",
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
                            <ColorPicker color={shapeColor} onColorChange={handleColorChange} />
                        </div>
                    </form>
                    ) : (
                    <div className="empty-shape-state">
                        <h2>Select a shape!</h2>
                        <p>Drag one in from the left, or click an existing shape on the canvas.</p>
                    </div>
                )}
            </div>
    );
}

export default memo(ShapeSettings);