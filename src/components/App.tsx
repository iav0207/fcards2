import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, CssBaseline } from '@mui/material';

import Header from './layout/Header';
import LanguageSelection from './screens/LanguageSelection';
import PracticeSession from './screens/PracticeSession';
import CardManagement from './screens/CardManagement';
import Settings from './screens/Settings';

/**
 * Main application component
 */
const App: React.FC = () => {
  const [sourceLanguage, setSourceLanguage] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  // Start a new session
  const startSession = (source: string, target: string) => {
    setSourceLanguage(source);
    setTargetLanguage(target);
    setIsSessionActive(true);
  };
  
  // End current session
  const endSession = () => {
    setIsSessionActive(false);
  };
  
  return (
    <Router>
      <CssBaseline />
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <Header isSessionActive={isSessionActive} endSession={endSession} />
        
        <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
          <Routes>
            <Route 
              path="/" 
              element={
                isSessionActive && sourceLanguage && targetLanguage
                  ? <Navigate to="/practice" />
                  : <LanguageSelection onStartSession={startSession} />
              } 
            />
            
            <Route 
              path="/practice" 
              element={
                isSessionActive && sourceLanguage && targetLanguage
                  ? <PracticeSession 
                      sourceLanguage={sourceLanguage} 
                      targetLanguage={targetLanguage}
                      onSessionEnd={endSession}
                    />
                  : <Navigate to="/" />
              } 
            />
            
            <Route path="/cards" element={<CardManagement />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
};

export default App;