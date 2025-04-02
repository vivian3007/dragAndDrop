import React, {useEffect, useState} from "react";
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
        width: data?.shape?.width * data?.shape?.zoom,
        height: data?.shape?.height * data?.shape?.zoom,
        transform: `rotate(${data?.shape?.rotate ?? 0}deg)`,
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "grab",
        backgroundColor: data?.shape?.color || '#FFFFFF',
        zIndex: data?.shape?.zIndex ?? 10,
    };

    const style = transform
        ? {
            ...baseStyle,
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${data?.shape?.rotate ?? 0}deg)`,
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
            {/*{id}*/}
        </div>
    );
}
