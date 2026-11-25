import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PeopleOutline } from '@mui/icons-material';
import PatternBrowser from './PatternBrowser.tsx';
import { useDesignsWhereIn } from './useDesignsWhereIn.ts';
import { useFollowing } from './follows/FollowingProvider';
import { useT } from './i18n/LanguageProvider';

const Following = () => {
    const t = useT();
    const { followingIds, loaded } = useFollowing();
    const uids = useMemo(() => Array.from(followingIds), [followingIds]);
    const { amigurumis, loading, error } = useDesignsWhereIn('user_id', uids);

    return (
        <PatternBrowser
            amigurumis={amigurumis}
            loading={!loaded || loading}
            error={error}
            emptyIcon={<PeopleOutline />}
            emptyMessage={
                uids.length === 0 ? (
                    <>
                        {t('following.emptyNoOne')}{' '}
                        <Link to="/home" className="inline-link">{t('following.discover')}</Link>
                    </>
                ) : t('following.emptyNoDesigns')
            }
        />
    );
};

export default Following;
