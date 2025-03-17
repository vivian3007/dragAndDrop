import React from "react";
import { useDroppable } from "@dnd-kit/core";

export default function Droppable({ children }) {
    const { setNodeRef } = useDroppable({
        id: "droppable",
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                position: "relative",
                height: "100vh",
                width: "500px",
                border: "1px dashed #ccc",
            }}
        >
            {children}
        </div>
    );
}

// export default function Droppable(props) {
//   const { isOver, setNodeRef } = useDroppable({
//     id: "droppable",
//   });
//   const style = {
//     color: isOver ? "green" : undefined,
//     width: "500px",
//     height: "500px",
//   };

//   return (
//     <div ref={setNodeRef} style={style}>
//       {props.children}
//     </div>
//   );
// }
