import Droppable from "./Droppable";
import Draggable from "./Draggable";
import "./styles.css";
import {Button} from "@mui/material";

export default function ShapeField({
                                       droppedShapes,
                                       containerRef,
    shapeColor
                                   }: {
    droppedShapes: [];
    containerRef: any;
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
                border: "1px dashed #ccc",
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
