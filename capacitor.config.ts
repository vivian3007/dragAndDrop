import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'nl.vlaanderen.stitchify',
  appName: 'Stitchify',
  webDir: 'dist',
  plugins: {
    // Donkere iconen in de status- en navigatiebalk van Android. Standaard volgen die het
    // systeemthema, en in donkere modus werden ze wit op de (altijd lichte) app.
    SystemBars: {
      style: 'LIGHT',
    },
  },
};

export default config;
