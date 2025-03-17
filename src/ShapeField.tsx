import Droppable from "./Droppable";
import Draggable from "./Draggable";
import "./styles.css";
import { useRef } from "react";

export default function ShapeField({
                                       droppedShapes,
                                       setDroppedShapes,
                                       containerRef,
                                       shapeRef,
                                       navBarRef,
                                   }: {
    droppedShapes: [];
    setDroppedShapes: any;
    containerRef: any;
    shapeRef: any;
    navBarRef: any;
}) {
    let navBarWidth = null;

    if (navBarRef.current) {
        navBarWidth = navBarRef.current.clientWidth;
    }

    return (
        <div
            ref={containerRef}
            className="shape-container"
            style={{
                // position: "relative",
                left: navBarWidth + 8,
                height: "100vh",
                border: "1px dashed #ccc",
            }}
        >
            <Droppable>
                {droppedShapes.map((shape, index) => {
                    return (
                        <Draggable key={shape.id} id={shape.id} data={shape.type}>
                            <div
                                ref={shapeRef}
                                className={`shape ${shape.type}`}
                                style={{
                                    position: "absolute",
                                    left: shape.x,
                                    top: shape.y,
                                    textAlign: "center",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    transform: "translate(-50%, -50%)",
                                }}
                            >
                                {shape.id}
                            </div>
                        </Draggable>
                    );
                })}
            </Droppable>
        </div>
    );
}
