import { Image as ImageIcon } from '@mui/icons-material';

// Generieke "geen foto" placeholder in de stijl van de app — vervangt de oude losse set
// stockfoto's (duck/cow/cat/dog/bunny) die niets met het patroon te maken hadden.
const ImagePlaceholder = ({ className, iconSize = '2.5rem' }: { className?: string; iconSize?: string }) => (
    <div
        className={className}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-accent-soft)',
        }}
    >
        <ImageIcon sx={{ fontSize: iconSize, color: 'var(--color-primary)' }} />
    </div>
);

export default ImagePlaceholder;
