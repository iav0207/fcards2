import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Alert,
  Grid,
  Paper,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import { Check as CheckIcon, Clear as ClearIcon } from '@mui/icons-material';
import { FlashCard, Session, SessionResponse } from '../../models';
import { SessionService } from '../../services/SessionService';
import { TranslationService } from '../../services/TranslationService';
import { DatabaseService } from '../../services/DatabaseService';
import { useSettings } from '../context/SettingsContext';

interface PracticeSessionProps {
  sourceLanguage: string;
  targetLanguage: string;
  onSessionEnd: () => void;
}

/**
 * Practice session screen component
 */
const PracticeSession: React.FC<PracticeSessionProps> = ({
  sourceLanguage,
  targetLanguage,
  onSessionEnd
}) => {
  // Services
  const databaseService = useRef(new DatabaseService());
  const sessionService = useRef(new SessionService(databaseService.current));
  const { settings } = useSettings();
  const translationService = useRef(new TranslationService(settings));
  
  // State
  const [session, setSession] = useState<Session | null>(null);
  const [currentCard, setCurrentCard] = useState<FlashCard | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<{
    isCorrect: boolean;
    feedback: string;
    suggestedTranslation?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        
        // Create a new session
        const newSession = sessionService.current.createSession(sourceLanguage, targetLanguage);
        setSession(newSession);
        
        // Get the first card
        const firstCard = sessionService.current.getCurrentCard(newSession);
        setCurrentCard(firstCard);
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing session:', error);
        setError('Failed to initialize practice session. Please try again.');
        setLoading(false);
      }
    };
    
    initializeSession();
  }, [sourceLanguage, targetLanguage]);
  
  // Update translation service when settings change
  useEffect(() => {
    translationService.current.updateSettings(settings);
  }, [settings]);
  
  // Submit translation
  const handleSubmitTranslation = async () => {
    if (!session || !currentCard) return;
    
    try {
      setLoading(true);
      
      // Evaluate translation
      const evaluation = await translationService.current.evaluateTranslation(
        currentCard.content,
        userTranslation,
        currentCard.userTranslation,
        sourceLanguage,
        targetLanguage
      );
      
      setEvaluationResult(evaluation);
      
      // Update session with response
      const updatedSession = sessionService.current.recordResponse(
        session,
        currentCard.id,
        userTranslation,
        evaluation.isCorrect
      );
      
      setSession(updatedSession);
      setLoading(false);
    } catch (error) {
      console.error('Error submitting translation:', error);
      setError('Failed to submit translation. Please try again.');
      setLoading(false);
    }
  };
  
  // Move to next card
  const handleNextCard = () => {
    if (!session) return;
    
    // Check if session is complete
    if (session.currentCardIndex >= session.cardIds.length) {
      onSessionEnd();
      return;
    }
    
    // Get next card
    const nextCard = sessionService.current.getCurrentCard(session);
    
    setCurrentCard(nextCard);
    setUserTranslation('');
    setEvaluationResult(null);
  };
  
  // End session early
  const handleEndSessionEarly = () => {
    onSessionEnd();
  };
  
  // Calculate session progress
  const calculateProgress = (): number => {
    if (!session) return 0;
    
    const totalCards = session.cardIds.length;
    const completedCards = session.responses.length;
    
    return (completedCards / totalCards) * 100;
  };
  
  // Get session stats
  const getSessionStats = (): { total: number; correct: number; accuracy: number } => {
    if (!session) return { total: 0, correct: 0, accuracy: 0 };
    
    return sessionService.current.getSessionStats(session);
  };
  
  if (loading && !currentCard) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Loading practice session...</Typography>
        <LinearProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleEndSessionEarly}>
          Return to Home
        </Button>
      </Box>
    );
  }
  
  // Session completed
  if (session && session.currentCardIndex >= session.cardIds.length) {
    const stats = getSessionStats();
    
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Session Complete
            </Typography>
            
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography variant="h5" gutterBottom>
                Your Results
              </Typography>
              
              <Typography variant="h2" color={stats.accuracy >= 70 ? 'success.main' : 'error.main'}>
                {stats.accuracy.toFixed(1)}%
              </Typography>
              
              <Typography variant="body1" sx={{ mt: 2 }}>
                {stats.correct} correct out of {stats.total} cards
              </Typography>
            </Box>
            
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={onSessionEnd}
              >
                Return to Home
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }
  
  // Active session
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Progress bar */}
      <Box sx={{ mb: 3 }}>
        <LinearProgress 
          variant="determinate" 
          value={calculateProgress()} 
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {session?.responses.length || 0} of {session?.cardIds.length || 0} cards
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getSessionStats().accuracy.toFixed(1)}% correct
          </Typography>
        </Box>
      </Box>
      
      <Card>
        <CardContent>
          {/* Source content */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="overline" color="text.secondary" gutterBottom>
              {sourceLanguage.toUpperCase()}
            </Typography>
            <Typography variant="h4">
              {currentCard?.content}
            </Typography>
            
            {/* Tags */}
            {currentCard?.tags.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {currentCard.tags.map(tag => (
                  <Chip 
                    key={tag} 
                    label={tag} 
                    size="small" 
                    variant="outlined" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                ))}
              </Box>
            )}
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Translation input or evaluation result */}
          {evaluationResult ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="overline" color="text.secondary" sx={{ mr: 1 }}>
                  YOUR ANSWER:
                </Typography>
                {evaluationResult.isCorrect ? (
                  <Chip 
                    icon={<CheckIcon />} 
                    label="Correct" 
                    color="success" 
                    size="small" 
                  />
                ) : (
                  <Chip 
                    icon={<ClearIcon />} 
                    label="Incorrect" 
                    color="error" 
                    size="small" 
                  />
                )}
              </Box>
              
              <Typography variant="h5" sx={{ mb: 3 }}>
                {userTranslation}
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {evaluationResult.feedback}
                </Typography>
              </Paper>
              
              {/* User notes and translation */}
              {(currentCard?.comment || currentCard?.userTranslation) && (
                <Box sx={{ mt: 4 }}>
                  {currentCard.comment && (
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      <strong>Note:</strong> {currentCard.comment}
                    </Typography>
                  )}
                  
                  {currentCard.userTranslation && (
                    <Typography variant="body1" color="text.secondary">
                      <strong>Saved translation:</strong> {currentCard.userTranslation}
                    </Typography>
                  )}
                </Box>
              )}
              
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNextCard}
                >
                  {session?.currentCardIndex === session?.cardIds.length - 1
                    ? 'Complete Session'
                    : 'Next Card'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="overline" color="text.secondary" gutterBottom>
                {targetLanguage.toUpperCase()}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Your translation"
                value={userTranslation}
                onChange={(e) => setUserTranslation(e.target.value)}
                variant="outlined"
                sx={{ mb: 3 }}
              />
              
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmitTranslation}
                  disabled={!userTranslation.trim() || loading}
                >
                  {loading ? 'Checking...' : 'Check Answer'}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PracticeSession;