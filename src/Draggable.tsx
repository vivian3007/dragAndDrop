import React from "react";
import { useDraggable } from "@dnd-kit/core";

export default function Draggable({ id, data }: { id: string; data: any }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
        data: {
            shape: data?.shape,
        },
    });

    const baseStyle = {
        position: "absolute",
        left: data?.shape?.x ?? 0,
        top: data?.shape?.y ?? 0,
        width: data?.shape?.width,
        height: data?.shape?.height,
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "grab",
    };

    const style = transform
        ? {
            ...baseStyle,
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : baseStyle;

    return (
        <div
            className={`${data?.shape?.type} draggable-shape`}
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onMouseDown={() => {console.log("mouse down")}}
        >
            {id}
        </div>
    );
}
