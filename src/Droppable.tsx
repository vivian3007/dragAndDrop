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
                width: "100vw",
            }}
        >
            {children}
        </div>
    );
}