import PatternBrowser from './PatternBrowser.tsx';

// Alle ontwerpen van iedereen. Zoeken, filteren, sorteren en per pagina laden doet de server
// (zie useDesignSearch): dit kunnen er veel worden.
const Homepage = () => <PatternBrowser serverSide />;

export default Homepage;
