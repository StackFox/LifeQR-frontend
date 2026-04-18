import { useEffect } from 'react';
import { Provider as PaperProvider, MD3LightTheme, Portal, Snackbar } from 'react-native-paper';
import { initDB } from './src/db/sqlite';
import { syncPendingRecords } from './src/services/syncManager';
import Navigation from './src/navigation';
import { useToastStore } from './src/store/toastStore';

const theme = {
  ...MD3LightTheme,
  roundness: 14,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0F172A',
    secondary: '#1E293B',
    tertiary: '#334155',
    surface: '#ffffff',
    background: '#f8fafc',
    outline: '#cbd5e1',
    surfaceVariant: '#e2e8f0',
  },
};

export default function App() {
  const { visible, message, duration, hideToast } = useToastStore();

  useEffect(() => {
    // Init DB + attempt sync on startup
    initDB()
      .then(() => syncPendingRecords())
      .then(({ synced, failed }) => {
        if (synced > 0) console.log(`Synced ${synced} offline records`);
        if (failed > 0) console.warn(`Failed to sync ${failed} records`);
      })
      .catch(console.error);
  }, []);

  return (
    <PaperProvider theme={theme}>
      <Navigation />
      <Portal>
        <Snackbar
          visible={visible}
          onDismiss={hideToast}
          duration={duration}
          style={{
            margin: 16,
            borderRadius: 12,
            backgroundColor: '#0F172A',
          }}
        >
          {message}
        </Snackbar>
      </Portal>
    </PaperProvider>
  );
}
