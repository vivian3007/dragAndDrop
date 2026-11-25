import { useState } from 'react';
import { AddPhotoAlternate } from '@mui/icons-material';
import { useT } from './i18n/LanguageProvider';

// Interactieve foto-picker: stippelrand met icoon en uitleg als er nog geen foto is,
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
    const t = useT();

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
                <img src={previewSrc} alt={t('imageDropzone.preview')} className="pattern-image-dropzone-preview" />
            ) : (
                <span className="pattern-image-dropzone-empty">
                    <span className="pattern-image-dropzone-icon" aria-hidden="true"><AddPhotoAlternate /></span>
                    <span className="pattern-image-dropzone-label">{t('imageDropzone.choose')}</span>
                    <span className="pattern-image-dropzone-hint">{t('imageDropzone.hint')}</span>
                </span>
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
