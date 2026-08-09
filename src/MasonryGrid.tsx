import React, { useEffect, useRef, useState } from 'react';

const MasonryGrid = <T,>({
    items,
    renderItem,
    columnWidth,
    gap,
    className,
}: {
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    columnWidth: number;
    gap: number;
    className?: string;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [columnCount, setColumnCount] = useState(1);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateColumnCount = () => {
            const width = container.clientWidth;
            const count = Math.max(1, Math.floor((width + gap) / (columnWidth + gap)));
            setColumnCount(count);
        };

        updateColumnCount();
        const observer = new ResizeObserver(updateColumnCount);
        observer.observe(container);
        return () => observer.disconnect();
    }, [columnWidth, gap]);

    const columns: T[][] = Array.from({ length: columnCount }, () => []);
    items.forEach((item, index) => {
        columns[index % columnCount].push(item);
    });

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ display: 'flex', gap: `${gap}px`, justifyContent: 'center' }}
        >
            {columns.map((columnItems, colIndex) => (
                <div
                    key={colIndex}
                    style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px`, width: columnWidth, maxWidth: '100%' }}
                >
                    {columnItems.map((item) => renderItem(item))}
                </div>
            ))}
        </div>
    );
};

export default MasonryGrid;
