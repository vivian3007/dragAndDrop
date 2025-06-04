import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import Trashcan from "./Trashcan.tsx";
import Sketch from "@uiw/react-color-sketch";
import { ColorResult } from '@uiw/color-convert';
import YarnSettings from "./YarnSettings.tsx";
import ShapeSettings from "./ShapeSettings.tsx"
export default function Settingsbar({
                                        activeShape,
                                        onUpdateShape,
                                        onDeleteShape,
                                        shapeColor,
                                        setShapeColor,
                                        droppedShapes,
                                        onUpdateYarnInfo,
                                        yarnInfo,
                                    }: {
    activeShape: any,
    onUpdateShape: any,
    onDeleteShape: any,
    shapeColor: string,
    setShapeColor: any,
    droppedShapes: [],
    onUpdateYarnInfo: any,
    yarnInfo: {},
}) {
    const [showYarnSettings, setShowYarnSettings] = useState(false)
    const navigate = useNavigate();
    const currentAmigurumiId = localStorage.getItem("amigurumi")

    const handlePatternNavigation = () => {
        navigate(`/${currentAmigurumiId}/pattern`, {
            state: { shapes: droppedShapes, yarnInfo: yarnInfo },
        });
    };

    const handleSettingsChange = () => {
        setShowYarnSettings(!showYarnSettings)
    }

    return (
        <nav className="settings-bar">
            {showYarnSettings ? (
                <YarnSettings onUpdateYarnInfo={onUpdateYarnInfo} yarnInfo={yarnInfo}/>
            ) : <ShapeSettings shapeColor={shapeColor} setShapeColor={setShapeColor} droppedShapes={droppedShapes} activeShape={activeShape} onUpdateShape={onUpdateShape} onDeleteShape={onDeleteShape}/>}
            <div style={{marginBottom: 20, alignItems: "center", display: "flex", flexDirection: "column"}}>
                <Button
                    variant="contained"
                    color="inherit"
                    sx={{width: 1, backgroundColor: "#F2F3AE", marginBottom: "10px"}}
                    onClick={handleSettingsChange}
                >
                    {showYarnSettings ? "Shape settings" : "Yarn settings"}
                </Button>
                <Button
                    variant="contained"
                    color="inherit"
                    sx={{width: 1, backgroundColor: "#F2F3AE", marginBottom: "10px"}}
                    disabled={!droppedShapes || droppedShapes.length < 1}
                    onClick={handlePatternNavigation}
                >
                    Pattern
                </Button>
            </div>
        </nav>
    );
}