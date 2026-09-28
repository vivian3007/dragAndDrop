import React, { useEffect, useRef, useState } from 'react';

const MasonryGrid = <T,>({
    items,
    renderItem,
    columnWidth,
    gap,
    className,
    minColumns = 1,
    compactGap,
}: {
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    columnWidth: number;
    gap: number;
    className?: string;
    // Ondergrens op het aantal kolommen: op smalle schermen zou het rekenen met een vaste
    // columnWidth uitkomen op 1 kolom, maar bv. op xs is 2 (kleinere) kolommen gewenst i.p.v.
    // één kolom met kaarten op volle breedte. De kolombreedte krimpt dan mee om te passen.
    minColumns?: number;
    // Kleinere gap die gebruikt wordt zodra minColumns het aantal kolommen omhoog dwingt (de
    // kaarten zijn dan toch al gekrompen, dus de normale gap zou verhoudingsgewijs te veel
    // ruimte tussen de kaarten innemen). Valt terug op `gap` als niet meegegeven.
    compactGap?: number;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [columnCount, setColumnCount] = useState(minColumns);
    const [actualColumnWidth, setActualColumnWidth] = useState(columnWidth);
    const [actualGap, setActualGap] = useState(gap);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateLayout = () => {
            const width = container.clientWidth;
            const naturalCount = Math.max(1, Math.floor((width + gap) / (columnWidth + gap)));
            const isCompact = naturalCount < minColumns;
            const effectiveGap = isCompact ? (compactGap ?? gap) : gap;
            const count = Math.max(minColumns, naturalCount);
            setColumnCount(count);
            setActualGap(effectiveGap);
            setActualColumnWidth(Math.min(columnWidth, (width - effectiveGap * (count - 1)) / count));
        };

        updateLayout();
        const observer = new ResizeObserver(updateLayout);
        observer.observe(container);
        return () => observer.disconnect();
    }, [columnWidth, gap, minColumns, compactGap]);

    const columns: T[][] = Array.from({ length: columnCount }, () => []);
    items.forEach((item, index) => {
        columns[index % columnCount].push(item);
    });

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ display: 'flex', gap: `${actualGap}px`, justifyContent: 'center' }}
        >
            {columns.map((columnItems, colIndex) => (
                <div
                    key={colIndex}
                    style={{ display: 'flex', flexDirection: 'column', gap: `${actualGap}px`, width: actualColumnWidth, maxWidth: '100%' }}
                >
                    {columnItems.map((item) => renderItem(item))}
                </div>
            ))}
        </div>
    );
};

export default MasonryGrid;
