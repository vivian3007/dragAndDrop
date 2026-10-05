import { Link } from 'react-router-dom';
import { useUsernameForUid } from './users/usernames';
import { useT } from './i18n/LanguageProvider';

export const profilePath = (username: string) => `/profile/${encodeURIComponent(username)}`;

// Gebruiker als kleine chip met initiaal, die naar het openbare profiel linkt. Bewust
// anders vormgegeven dan een gewone tekstlink: zo is zichtbaar dat je naar een persoon
// gaat (en de pagina verlaat), niet dat er iets binnen de huidige weergave verandert.
// `onNavigate` laat een omringende dialoog zich sluiten, anders blijft die over de
// profielpagina heen open staan.
//
// `userId` is het Firebase-uid waarmee ontwerpen en foto's hun eigenaar opslaan; we zoeken
// de gebruikersnaam erbij. Zonder gebruikersnaam (accounts die er nog geen gekozen hebben,
// of ontwerpen zonder eigenaar) een niet-klikbare chip.
const UserLink = ({ userId, onNavigate }: { userId?: string | null; onNavigate?: () => void }) => {
    const t = useT();
    const username = useUsernameForUid(userId);

    if (username === undefined) {
        return (
            <span className="user-chip user-chip--loading" aria-busy="true">
                <span className="user-chip-avatar" aria-hidden="true" />
                <span className="user-chip-name">…</span>
            </span>
        );
    }

    if (!username) {
        return (
            <span className="user-chip user-chip--unknown">
                <span className="user-chip-avatar" aria-hidden="true">?</span>
                <span className="user-chip-name">{t('detail.unknown')}</span>
            </span>
        );
    }

    return (
        <Link
            to={profilePath(username)}
            className="user-chip"
            onClick={(e) => {
                e.stopPropagation();
                onNavigate?.();
            }}
        >
            <span className="user-chip-avatar" aria-hidden="true">{username.charAt(0).toUpperCase()}</span>
            <span className="user-chip-name">@{username}</span>
        </Link>
    );
};

export default UserLink;
