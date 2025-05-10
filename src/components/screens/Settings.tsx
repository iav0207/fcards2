import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Restore as ResetIcon,
} from '@mui/icons-material';
import { useSettings } from '../context/SettingsContext';

/**
 * Settings screen component
 */
const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  
  const [formValues, setFormValues] = useState({
    darkMode: settings.darkMode,
    translationApiKey: settings.translationApiKey || '',
    translationApiProvider: settings.translationApiProvider,
    maxCardsPerSession: settings.maxCardsPerSession
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Handle form value changes
  const handleChange = (
    field: keyof typeof formValues,
    value: string | number | boolean
  ) => {
    setFormValues({
      ...formValues,
      [field]: value
    });
  };
  
  // Save settings
  const handleSave = () => {
    updateSettings({
      darkMode: formValues.darkMode,
      translationApiKey: formValues.translationApiKey || undefined,
      translationApiProvider: formValues.translationApiProvider,
      maxCardsPerSession: formValues.maxCardsPerSession
    });
    
    showSnackbar('Settings saved successfully.', 'success');
  };
  
  // Reset settings to default
  const handleReset = () => {
    resetSettings();
    
    // Update form values
    setFormValues({
      darkMode: settings.darkMode,
      translationApiKey: settings.translationApiKey || '',
      translationApiProvider: settings.translationApiProvider,
      maxCardsPerSession: settings.maxCardsPerSession
    });
    
    showSnackbar('Settings reset to default.', 'info');
  };
  
  // Toggle API key visibility
  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };
  
  // Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Settings
          </Typography>
          
          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formValues.darkMode}
                  onChange={(e) => handleChange('darkMode', e.target.checked)}
                />
              }
              label="Dark Mode"
            />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              Translation API
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>API Provider</InputLabel>
              <Select
                value={formValues.translationApiProvider}
                label="API Provider"
                onChange={(e) => handleChange('translationApiProvider', e.target.value)}
              >
                <MenuItem value="gemini">Google Gemini</MenuItem>
                <MenuItem value="openai">OpenAI</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="API Key"
              fullWidth
              margin="normal"
              value={formValues.translationApiKey}
              onChange={(e) => handleChange('translationApiKey', e.target.value)}
              type={showApiKey ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle api key visibility"
                      onClick={toggleShowApiKey}
                      edge="end"
                    >
                      {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
              <Typography variant="body2" color="text.secondary">
                {formValues.translationApiProvider === 'gemini' ? (
                  <>
                    To use Google Gemini for translation evaluation, you will need an API key from the Google AI Studio.
                    Visit <Link href="https://ai.google.dev/">ai.google.dev</Link> to get your API key.
                  </>
                ) : (
                  <>
                    To use OpenAI for translation evaluation, you will need an API key from OpenAI.
                    Visit <Link href="https://platform.openai.com/api-keys">platform.openai.com</Link> to get your API key.
                  </>
                )}
              </Typography>
            </Paper>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              Practice Sessions
            </Typography>
            
            <TextField
              label="Maximum Cards per Session"
              type="number"
              fullWidth
              margin="normal"
              value={formValues.maxCardsPerSession}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value > 0) {
                  handleChange('maxCardsPerSession', value);
                }
              }}
              InputProps={{
                inputProps: { min: 1, max: 100 }
              }}
            />
          </Box>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<ResetIcon />}
              onClick={handleReset}
            >
              Reset to Default
            </Button>
            
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save Settings
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Simple link component
const Link: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
    {children}
  </a>
);

export default Settings;