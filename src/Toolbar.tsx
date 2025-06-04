import React from "react";
import {Button} from "@mui/material";

export default function Toolbar({ setView, setTransformMode }: { setView: (viewKey: string) => void, setTransformMode: any }) {

    return (
        <div className="toolbar">
            <h1 className="shapes-text">View</h1>
            <div className="toolbar-category">
                <Button variant="contained" onClick={() => setView('front')}>Front</Button>
                <Button variant="contained" onClick={() => setView('back')}>Back</Button>
                <Button variant="contained" onClick={() => setView('left')}>Left</Button>
                <Button variant="contained" onClick={() => setView('right')}>Right</Button>
                <Button variant="contained" onClick={() => setView('top')}>Up</Button>
            </div>
            <h1 className="shapes-text">Transform Mode</h1>
            <div className="toolbar-category">
                <Button variant="contained" onClick={() => setTransformMode('translate')}>Translate</Button>
                <Button variant="contained" onClick={() => setTransformMode('scale')}>Scale</Button>
                <Button variant="contained" onClick={() => setTransformMode('rotate')}>Rotate</Button>
            </div>
        </div>
    );
}
