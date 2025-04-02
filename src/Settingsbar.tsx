import {useEffect, useState} from "react";
import {HexColorInput, HexColorPicker} from "react-colorful";
import {Button} from "@mui/material";
import {Link, useNavigate} from "react-router-dom";
import Trashcan from "./Trashcan.tsx";
import Sketch from "@uiw/react-color-sketch";
import { ColorResult } from '@uiw/color-convert';

export default function Settingsbar({activeShape, onUpdateShape, shapeColor, setShapeColor, droppedShapes, dragging}: {activeShape: any, onUpdateShape: any, shapeColor: string, setShapeColor: any, droppedShapes: any, dragging: boolean}) {
    const [width, setWidth] = useState(null);
    const [height, setHeight] = useState(null);
    const [name, setName] = useState(null);
    const [rotate, setRotate] = useState(null);
    const [zIndex, setZIndex] = useState(10);
    const [zoom, setZoom] = useState(1);
    const navigate = useNavigate();

    const handleUpdate = (updates: Partial<any>) => {
        if (activeShape) {
            onUpdateShape({
                id: activeShape.id,
                ...activeShape,
                ...updates
            });
        }
    };

    console.log(activeShape)

    useEffect(() => {
        setWidth(activeShape?.width || 50);
        setHeight(activeShape?.height || 50);
        setName(activeShape?.name || null);
        setShapeColor(activeShape?.color || '#FFFFFF');
        setRotate(activeShape?.rotate || 0);
        setZIndex(activeShape?.zIndex || 10);
        setZoom(activeShape?.zoom || 1);
    }, [activeShape]);

    const handleBringToFront = () => {
        if (activeShape) {
            const newZIndex = zIndex + 1;
            setZIndex(newZIndex);
            handleUpdate({ zIndex: newZIndex });
        }
    };

    const handleSendToBack = () => {
        if (activeShape) {
            const newZIndex = zIndex - 1;
            setZIndex(newZIndex);
            handleUpdate({ zIndex: newZIndex });
        }
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newWidth = Number(e.target.value);
        setWidth(newWidth);
        handleUpdate({ width: newWidth });
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHeight = Number(e.target.value);
        setHeight(newHeight);
        handleUpdate({ height: newHeight });
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        handleUpdate({ name: newName });
    };

    const handleRotateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRotate = Number(e.target.value);
        setRotate(newRotate);
        handleUpdate({ rotate: newRotate });
    };

    const handleColorChange = (newShade: ColorResult) => {
        setShapeColor(newShade.hex);
        handleUpdate({ color: newShade.hex });
    };

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = Number(e.target.value);
        setZoom(newZoom);
        handleUpdate({ zoom: newZoom });
    };

    const displayName = name !== null ? name : activeShape?.name ?? "";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeShape) {
            onUpdateShape({
                id: activeShape.id,
                width: Number(width),
                height: Number(height),
                color: shapeColor,
                name: name,
                rotate: Number(rotate),
                zIndex: Number(zIndex),
                zoom: Number(zoom),
            });
        }
        navigate('/pattern', {
            shapes: droppedShapes,
        });
    };


    return (
        <nav className="settings-bar">
            <div>
            <h1>Settings: {activeShape?.name}</h1>
            {activeShape ? (
                <form onSubmit={handleSubmit}>
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
                        <label htmlFor="width">Width: </label>
                        <input
                            type="number"
                            id="width"
                            value={width}
                            onChange={handleWidthChange}
                            min="10"
                            step="10"
                            required={true}
                            placeholder="Give this part a width"
                        />
                    </div>
                    <div className="input-text">
                        <label htmlFor="height">Height: </label>
                        <input
                            type="number"
                            id="height"
                            value={height}
                            onChange={handleHeightChange}
                            min="10"
                            step="10"
                            required={true}
                            placeholder="Give this part a height"
                        />
                    </div>
                    <div className="input-text">
                        <label htmlFor="zoom">Zoom: </label>
                        <input
                            type="number"
                            id="zoom"
                            value={zoom}
                            onChange={handleZoomChange}
                            min="0.1"
                            step="0.1"
                            // required={true}
                            placeholder="Give this part a zoom"
                        />
                    </div>
                    <div className="input-text">
                        <label htmlFor="height">Rotation: </label>
                        <input
                            type="number"
                            id="rotate"
                            value={rotate ?? "0"}
                            onChange={handleRotateChange}
                            min="0"
                            step="1"
                            placeholder="Give this part a rotation"
                        />
                    </div>
                    <Button type="button" variant="contained" color="secondary"
                            sx={{marginBottom: "20px", width: 1}} onClick={handleBringToFront}>Bring to front</Button>
                    <Button type="button" variant="contained" color="secondary"
                            sx={{marginBottom: "20px", width: 1}} onClick={handleSendToBack}>Send to back</Button>
                    <Sketch
                        style={{marginTop: "20px", marginBottom: "20px"}}
                        color={shapeColor}
                        onChange={handleColorChange}
                    />
                    {/*<HexColorPicker color={shapeColor} onChange={handleColorChange}*/}
                    {/*                style={{marginTop: "20px", marginBottom: "20px"}}/>*/}
                    {/*<Button type="submit" variant="contained" color="secondary"*/}
                    {/*        sx={{marginBottom: "20px", width: 1}}>Save</Button>*/}
                        <Button type="submit" variant="contained" color="primary" sx={{width: 1}}
                                disabled={!droppedShapes || droppedShapes.length < 1}>
                            Pattern
                            {/*<Link to="/pattern" style={{width: "100%"}}>Pattern</Link>*/}
                        </Button>
                </form>
            ) : (
                <p>No shape selected</p>
            )}
            </div>
            <div style={{marginBottom: 20, alignItems: "center", display: "flex", flexDirection: "column"}}>
                <Trashcan dragging={dragging}/>
            </div>
        </nav>
    );
}