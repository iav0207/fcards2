import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings, DEFAULT_SETTINGS } from '@/models';
import { SettingsService } from '@/services';

/**
 * Settings context interface
 */
interface SettingsContextType {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;
}

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Settings provider component
 */
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const settingsService = new SettingsService();
  
  // Load settings on component mount
  useEffect(() => {
    const loadedSettings = settingsService.loadSettings();
    setSettings(loadedSettings);
  }, []);
  
  // Update settings
  const updateSettings = (newSettings: Partial<Settings>) => {
    const updatedSettings = settingsService.updateSettings(newSettings);
    setSettings(updatedSettings);
  };
  
  // Reset settings to default
  const resetSettings = () => {
    const defaultSettings = settingsService.resetSettings();
    setSettings(defaultSettings);
  };
  
  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to use settings context
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
};