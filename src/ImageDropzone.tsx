import { useState } from 'react';
import { AddPhotoAlternate } from '@mui/icons-material';

// Interactieve foto-picker: stippelrand met image+plus-icoon als er nog geen foto is,
// rand wordt donkerder bij hover/drag-over, accepteert een gesleepte afbeelding, en een
// klik opent de bestandskiezer (via het onderliggende <label>/<input type="file"> — geen
// apart knopje nodig).
const ImageDropzone = ({
    previewSrc,
    onFileSelected,
}: {
    previewSrc: string | null;
    onFileSelected: (file: File) => void;
}) => {
    const [isDragActive, setIsDragActive] = useState(false);

    return (
        <label
            className="pattern-image-dropzone"
            data-active={isDragActive}
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragActive(true);
            }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragActive(false);
                const file = e.dataTransfer.files?.[0];
                if (file) onFileSelected(file);
            }}
        >
            {previewSrc ? (
                <img src={previewSrc} alt="Voorbeeld" className="pattern-image-dropzone-preview" />
            ) : (
                <AddPhotoAlternate className="pattern-image-dropzone-icon" />
            )}
            <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileSelected(file);
                }}
            />
        </label>
    );
};

export default ImageDropzone;
