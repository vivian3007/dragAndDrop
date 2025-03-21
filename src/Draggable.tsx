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
        left: data?.shape?.x ?? 0, // Gebruik fallback 0 als x niet beschikbaar is
        top: data?.shape?.y ?? 0, // Gebruik fallback 0 als y niet beschikbaar is
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
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
        >
            {id}
        </div>
    );
}
