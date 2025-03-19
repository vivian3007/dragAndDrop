import {useEffect, useState} from "react";

export default function Settingsbar({activeShape, onUpdateShape}: {activeShape: any, onUpdateShape: any}) {
    const [width, setWidth] = useState(null);
    const [height, setHeight] = useState(null);

    console.log(activeShape);

    useEffect(() => {
        setWidth(activeShape?.width || 50);
        setHeight(activeShape?.height || 50);
    }, [activeShape]);

    const handleSubmit = (e: React.FormEvent) => {
        console.log("save");
        e.preventDefault();
        if (activeShape) {
            onUpdateShape({
                id: activeShape.id,
                width: Number(width),
                height: Number(height),
            });
        }
    };
    return (
        <nav className="settings-bar">
            <h1>Settings</h1>
            {activeShape ? (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="width">Width:</label>
                        <input
                            type="number"
                            id="width"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            min="10"
                            step="1"
                        />
                    </div>
                    <div>
                        <label htmlFor="height">Height:</label>
                        <input
                            type="number"
                            id="height"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            min="10" // Optioneel: minimum waarde
                            step="1"
                        />
                    </div>
                    <button type="submit">Save</button>
                </form>
            ) : (
                <p>No shape selected</p>
            )}
        </nav>
    );
}