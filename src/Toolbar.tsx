import React from "react";
import {Button} from "@mui/material";

function Toolbar({ setView, setTransformMode, showGrid, setShowGrid }: { setView: (viewKey: string) => void, setTransformMode: any, showGrid: boolean, setShowGrid: any }) {

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
            <h1 className="shapes-text">Grid</h1>
            <div className="toolbar-category">
                <Button variant="contained" onClick={() => setShowGrid((v: boolean) => !v)}>
                    {showGrid ? 'Hide grid' : 'Show grid'}
                </Button>
            </div>
        </div>
    );
}

export default React.memo(Toolbar);
