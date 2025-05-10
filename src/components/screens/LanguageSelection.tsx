import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Grid,
  SelectChangeEvent
} from '@mui/material';
import { FlashCard } from '../../models';

// Define supported languages (ISO 639-1 codes and names)
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' }
];

interface LanguageSelectionProps {
  onStartSession: (sourceLanguage: string, targetLanguage: string) => void;
}

/**
 * Language selection screen component
 */
const LanguageSelection: React.FC<LanguageSelectionProps> = ({ onStartSession }) => {
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load available languages from database on component mount
  useEffect(() => {
    const loadAvailableLanguages = async () => {
      try {
        setLoading(true);
        
        // Get all flash cards from the database
        const flashCards: FlashCard[] = await window.api.getAllFlashCards();
        
        // Extract unique source languages
        const languages = [...new Set(flashCards.map(card => card.sourceLanguage))];
        
        setAvailableLanguages(languages);
        
        // Set default selections if possible
        if (languages.length > 0) {
          setSourceLanguage(languages[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading available languages:', error);
        setError('Failed to load available languages. Please try again.');
        setLoading(false);
      }
    };
    
    loadAvailableLanguages();
  }, []);
  
  // Handle source language change
  const handleSourceLanguageChange = (event: SelectChangeEvent<string>) => {
    setSourceLanguage(event.target.value);
    
    // Reset target language if it's the same as source
    if (event.target.value === targetLanguage) {
      setTargetLanguage('');
    }
  };
  
  // Handle target language change
  const handleTargetLanguageChange = (event: SelectChangeEvent<string>) => {
    setTargetLanguage(event.target.value);
  };
  
  // Start practice session
  const handleStartSession = () => {
    // Validation
    if (!sourceLanguage) {
      setError('Please select a source language.');
      return;
    }
    
    if (!targetLanguage) {
      setError('Please select a target language.');
      return;
    }
    
    if (sourceLanguage === targetLanguage) {
      setError('Source and target languages must be different.');
      return;
    }
    
    // Clear any errors
    setError(null);
    
    // Start session
    onStartSession(sourceLanguage, targetLanguage);
  };
  
  // Get language name by code
  const getLanguageName = (code: string): string => {
    const language = LANGUAGES.find(lang => lang.code === code);
    return language ? language.name : code;
  };
  
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Start Practice Session
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Typography>Loading available languages...</Typography>
          ) : availableLanguages.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              No flash cards found. Please add some cards first via the Card Management screen.
            </Alert>
          ) : (
            <>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="source-language-label">Source Language</InputLabel>
                    <Select
                      labelId="source-language-label"
                      id="source-language"
                      value={sourceLanguage}
                      label="Source Language"
                      onChange={handleSourceLanguageChange}
                    >
                      {availableLanguages.map(lang => (
                        <MenuItem key={lang} value={lang}>
                          {getLanguageName(lang)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="target-language-label">Target Language</InputLabel>
                    <Select
                      labelId="target-language-label"
                      id="target-language"
                      value={targetLanguage}
                      label="Target Language"
                      onChange={handleTargetLanguageChange}
                      disabled={!sourceLanguage}
                    >
                      {LANGUAGES.filter(lang => lang.code !== sourceLanguage).map(lang => (
                        <MenuItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStartSession}
                  disabled={!sourceLanguage || !targetLanguage}
                >
                  Start Practice
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LanguageSelection;