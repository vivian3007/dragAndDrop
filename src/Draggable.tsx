import React from "react";
import { useDraggable } from "@dnd-kit/core";

export default function Draggable({ id, data }: { id: string; data: any }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
        data: {
            type: data?.type,
            label: data?.label,
        },
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    return (
        <div
            className={data?.type}
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
        >
            {data?.label}
        </div>
    );
}
