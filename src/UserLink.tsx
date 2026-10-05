import { Link } from 'react-router-dom';

export const profilePath = (userId: string) => `/profile/${encodeURIComponent(userId)}`;

// Gebruikersnaam als link naar het openbare profiel. `onNavigate` laat een omringende
// dialoog zich sluiten, anders blijft die over de profielpagina heen open staan.
const UserLink = ({ userId, onNavigate }: { userId: string; onNavigate?: () => void }) => (
    <Link
        to={profilePath(userId)}
        className="user-link"
        onClick={(e) => {
            e.stopPropagation();
            onNavigate?.();
        }}
    >
        {userId}
    </Link>
);

export default UserLink;
