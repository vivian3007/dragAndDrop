import { Link } from 'react-router-dom';

export const profilePath = (userId: string) => `/profile/${encodeURIComponent(userId)}`;

// Gebruiker als kleine chip met initiaal, die naar het openbare profiel linkt. Bewust
// anders vormgegeven dan een gewone tekstlink: zo is zichtbaar dat je naar een persoon
// gaat (en de pagina verlaat), niet dat er iets binnen de huidige weergave verandert.
// `onNavigate` laat een omringende dialoog zich sluiten, anders blijft die over de
// profielpagina heen open staan.
const UserLink = ({ userId, onNavigate }: { userId: string; onNavigate?: () => void }) => (
    <Link
        to={profilePath(userId)}
        className="user-chip"
        onClick={(e) => {
            e.stopPropagation();
            onNavigate?.();
        }}
    >
        <span className="user-chip-avatar" aria-hidden="true">{userId.charAt(0).toUpperCase()}</span>
        <span className="user-chip-name">{userId}</span>
    </Link>
);

export default UserLink;
