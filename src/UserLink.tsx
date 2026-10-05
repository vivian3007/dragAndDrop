import { Link } from 'react-router-dom';
import { useT } from './i18n/LanguageProvider';

export const profilePath = (userId: string) => `/profile/${encodeURIComponent(userId)}`;

// Gebruiker als kleine chip met initiaal, die naar het openbare profiel linkt. Bewust
// anders vormgegeven dan een gewone tekstlink: zo is zichtbaar dat je naar een persoon
// gaat (en de pagina verlaat), niet dat er iets binnen de huidige weergave verandert.
// `onNavigate` laat een omringende dialoog zich sluiten, anders blijft die over de
// profielpagina heen open staan.
// Oude ontwerpen hebben soms geen user_id; dan een niet-klikbare chip i.p.v. een crash.
const UserLink = ({ userId, onNavigate }: { userId?: string | null; onNavigate?: () => void }) => {
    const t = useT();

    if (!userId) {
        return (
            <span className="user-chip user-chip--unknown">
                <span className="user-chip-avatar" aria-hidden="true">?</span>
                <span className="user-chip-name">{t('detail.unknown')}</span>
            </span>
        );
    }

    return (
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
};

export default UserLink;
