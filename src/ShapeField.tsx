import Droppable from "./Droppable";
import Draggable from "./Draggable";
import "./styles.css";
import {Button} from "@mui/material";
import Trashcan from "./Trashcan.tsx";
import React, {Ref} from "react";

export default function ShapeField({
                                       droppedShapes,
                                       containerRef,
    shapeColor
                                   }: {
    droppedShapes: [];
    containerRef: Ref<HTMLDivElement>;
    shapeColor: string;
}) {

    return (
        <div
            ref={containerRef}
            className="shape-container"
            style={{
                position: "relative",
                // left: navBarWidth + 8,
                height: "100vh",
                width: "70vw",
            }}
        >
            <Droppable>
                {droppedShapes.map((shape : HTMLDivElement) => {
                    return (
                        <Draggable key={shape.id} id={shape.id} data={{shape: shape}} />
                    );
                })}
            </Droppable>
        </div>
    );
}
