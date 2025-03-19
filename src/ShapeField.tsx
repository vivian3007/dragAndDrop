import Droppable from "./Droppable";
import Draggable from "./Draggable";
import "./styles.css";

export default function ShapeField({
                                       droppedShapes,
                                       containerRef,
                                   }: {
    droppedShapes: [];
    containerRef: any;
}) {


    // console.log(droppedShapes)

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
                        //     <div
                        //         ref={shapeRef}
                        //         className={`shape ${shape.type}`}
                        //         style={{
                        //             position: "absolute",
                        //             left: shape.x,
                        //             top: shape.y,
                        //             textAlign: "center",
                        //             display: "flex",
                        //             justifyContent: "center",
                        //             alignItems: "center",
                        //             transform: "translate(-50%, -50%)",
                        //         }}
                        //     >
                        //         {shape.id}
                        //     </div>
                    );
                })}
            </Droppable>
        </div>
    );
}
