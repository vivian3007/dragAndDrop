import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase-config.js';
import ImagePlaceholder from './ImagePlaceholder.tsx';

// Afbeelding voor een ontwerp zonder foto: een snapshot van de 3D-vormen, of de gewone
// placeholder zolang die er (nog) niet is of het ontwerp nog geen vormen heeft. Pas
// zodra de kaart in beeld komt worden de vormen opgehaald en wordt er getekend, zodat
// een lange lijst niet in één keer tientallen queries en renders afvuurt.
const DesignSnapshot = ({ amigurumiId, alt, className }: { amigurumiId: string; alt: string; className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' },
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;
        let cancelled = false;
        (async () => {
            const snapshot = await getDocs(query(collection(db, 'shapes'), where('amigurumi_id', '==', amigurumiId)));
            const shapes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Shape[];
            if (shapes.length === 0) return;
            const { renderDesignSnapshot } = await import('./designSnapshot');
            const image = await renderDesignSnapshot(amigurumiId, shapes);
            if (!cancelled) setSrc(image);
        })().catch((error) => console.error('Fout bij maken van ontwerp-snapshot:', error));
        return () => {
            cancelled = true;
        };
    }, [isVisible, amigurumiId]);

    return (
        <div ref={containerRef} className="design-snapshot">
            {src ? (
                <img src={src} alt={alt} className={`${className ?? ''} design-snapshot-image`} />
            ) : (
                <ImagePlaceholder className={className} />
            )}
        </div>
    );
};

export default DesignSnapshot;
