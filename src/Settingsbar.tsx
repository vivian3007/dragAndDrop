import {useEffect, useState} from "react";
import {HexColorInput, HexColorPicker} from "react-colorful";
import {Button} from "@mui/material";
import {Link} from "react-router-dom";

export default function Settingsbar({activeShape, onUpdateShape, shapeColor, setShapeColor, droppedShapes}: {activeShape: any, onUpdateShape: any, shapeColor: string, setShapeColor: any, droppedShapes: any}) {
    const [width, setWidth] = useState(null);
    const [height, setHeight] = useState(null);
    const [name, setName] = useState(null);

    useEffect(() => {
        setWidth(activeShape?.width || 50);
        setHeight(activeShape?.height || 50);
        setName(activeShape?.name || null);
        setShapeColor(activeShape?.color || '#FFFFFF');
    }, [activeShape]);

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
            });
        }
    };
    return (
        <nav className="settings-bar">
            <h1>Settings: {activeShape?.name}</h1>
            {activeShape ? (
                <form onSubmit={handleSubmit}>
                    <div className="input-text">
                        <label>Name: </label>
                        <input
                            type="text"
                            id="part"
                            value={displayName}
                            onChange={(e) => setName(e.target.value)}
                            required={true}
                        />
                    </div>
                    <div className="input-text">
                        <label htmlFor="width">Width: </label>
                        <input
                            type="number"
                            id="width"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            min="10"
                            step="10"
                            required={true}
                        />
                    </div>
                    <div className="input-text">
                        <label htmlFor="height">Height: </label>
                        <input
                            type="number"
                            id="height"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            min="10"
                            step="10"
                            required={true}
                        />
                    </div>
                    <HexColorPicker color={shapeColor} onChange={setShapeColor}
                                    style={{marginTop: "20px", marginBottom: "20px"}}/>
                    <Button type="submit" variant="contained" color="secondary" style={{marginBottom: "20px"}}>Save</Button>
                </form>
            ) : (
                <p>No shape selected</p>
            )}
            {droppedShapes && droppedShapes.length > 0 ? (
                <Link to="/pattern">
                    <Button variant="contained" color="primary">Pattern</Button>
                </Link>
            ) : null}
        </nav>
    );
}