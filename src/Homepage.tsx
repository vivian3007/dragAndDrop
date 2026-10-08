import { collection, query } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '../firebase-config.js';
import PatternBrowser from './PatternBrowser.tsx';

// Alle ontwerpen van iedereen.
const Homepage = () => {
    const [snapshot, loading, error] = useCollection(query(collection(db, 'amigurumi')));
    const amigurumis = snapshot
        ? (snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Amigurumi[])
        : [];

    return (
        <PatternBrowser
            amigurumis={amigurumis}
            loading={loading}
            error={error}
        />
    );
};

export default Homepage;
