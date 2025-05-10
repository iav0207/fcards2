import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import App from './components/App';
import { darkTheme, lightTheme } from './utils/theme';
import { SettingsProvider, useSettings } from './components/context/SettingsContext';

/**
 * Theme wrapper component
 */
const ThemedApp: React.FC = () => {
  const { settings } = useSettings();
  
  return (
    <ThemeProvider theme={settings.darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
};

/**
 * Main renderer entry point
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <ThemedApp />
    </SettingsProvider>
  </React.StrictMode>
);