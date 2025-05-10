import { Settings, DEFAULT_SETTINGS } from '@/models';

/**
 * Service for managing application settings
 */
export class SettingsService {
  private static STORAGE_KEY = 'flashcards_settings';
  
  /**
   * Load settings from local storage
   */
  loadSettings(): Settings {
    try {
      const storedSettings = localStorage.getItem(SettingsService.STORAGE_KEY);
      
      if (storedSettings) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    
    return DEFAULT_SETTINGS;
  }
  
  /**
   * Save settings to local storage
   */
  saveSettings(settings: Settings): void {
    try {
      localStorage.setItem(SettingsService.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
  
  /**
   * Update specific settings
   */
  updateSettings(partialSettings: Partial<Settings>): Settings {
    const currentSettings = this.loadSettings();
    const updatedSettings = { ...currentSettings, ...partialSettings };
    
    this.saveSettings(updatedSettings);
    return updatedSettings;
  }
  
  /**
   * Reset settings to default
   */
  resetSettings(): Settings {
    this.saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}