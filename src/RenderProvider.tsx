import { createContext, useCallback, useState} from "react";

export const RenderContext = createContext<(meshId: string) => void>(() => {});

export default function RenderProvider({ meshCount, onAllRendered, children }) {
    const [rendered, setRendered] = useState(new Set())

    // Handler for when a mesh renders
    const meshRendered = useCallback((meshId: string) => {
        setRendered(prev => {
            const next = new Set(prev)
            next.add(meshId)
            if (next.size === meshCount) onAllRendered?.()
            return next
        })
    }, [meshCount, onAllRendered])

    return (
        <RenderContext.Provider value={meshRendered}>
            {children}
        </RenderContext.Provider>
    )
}