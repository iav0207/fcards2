import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileUpload as ImportIcon,
  FileDownload as ExportIcon,
  Tag as TagIcon
} from '@mui/icons-material';
import { FlashCard } from '@/models';

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

/**
 * Card management screen component
 */
const CardManagement: React.FC = () => {
  // State
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<FlashCard[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashCard | null>(null);
  const [dialogContent, setDialogContent] = useState<{
    content: string;
    sourceLanguage: string;
    comment: string;
    userTranslation: string;
    tags: string;
  }>({
    content: '',
    sourceLanguage: '',
    comment: '',
    userTranslation: '',
    tags: ''
  });
  
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Load cards on component mount
  useEffect(() => {
    fetchCards();
  }, []);
  
  // Extract all unique tags when cards change
  useEffect(() => {
    const tags = new Set<string>();
    cards.forEach(card => {
      card.tags.forEach(tag => tags.add(tag));
    });
    setAllTags(Array.from(tags).sort());
  }, [cards]);
  
  // Filter cards when filters change
  useEffect(() => {
    filterCards();
  }, [cards, selectedLanguage, searchTerm, selectedTag, tabValue]);
  
  // Fetch all cards from database
  const fetchCards = async () => {
    try {
      const allCards: FlashCard[] = await window.api.getAllFlashCards();
      setCards(allCards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      showSnackbar('Failed to load flash cards.', 'error');
    }
  };
  
  // Filter cards based on current filters
  const filterCards = () => {
    let result = [...cards];
    
    // Filter by language
    if (selectedLanguage) {
      result = result.filter(card => card.sourceLanguage === selectedLanguage);
    }
    
    // Filter by tag
    if (selectedTag) {
      result = result.filter(card => card.tags.includes(selectedTag));
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(card => 
        card.content.toLowerCase().includes(term) ||
        (card.comment && card.comment.toLowerCase().includes(term)) ||
        (card.userTranslation && card.userTranslation.toLowerCase().includes(term))
      );
    }
    
    // Sort by most recent first
    result = result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    setFilteredCards(result);
  };
  
  // Handle language change
  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    setSelectedLanguage(event.target.value);
  };
  
  // Handle tag change
  const handleTagChange = (event: SelectChangeEvent<string>) => {
    setSelectedTag(event.target.value);
  };
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Open dialog to add a new card
  const handleAddCard = () => {
    setEditingCard(null);
    setDialogContent({
      content: '',
      sourceLanguage: selectedLanguage || '',
      comment: '',
      userTranslation: '',
      tags: ''
    });
    setDialogOpen(true);
  };
  
  // Open dialog to edit an existing card
  const handleEditCard = (card: FlashCard) => {
    setEditingCard(card);
    setDialogContent({
      content: card.content,
      sourceLanguage: card.sourceLanguage,
      comment: card.comment || '',
      userTranslation: card.userTranslation || '',
      tags: card.tags.join(', ')
    });
    setDialogOpen(true);
  };
  
  // Open confirmation dialog to delete a card
  const handleDeleteClick = (cardId: string) => {
    setCardToDelete(cardId);
    setConfirmDialogOpen(true);
  };
  
  // Delete a card
  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;
    
    try {
      const success = await window.api.deleteFlashCard(cardToDelete);
      
      if (success) {
        // Update local state
        setCards(cards.filter(card => card.id !== cardToDelete));
        showSnackbar('Flash card deleted successfully.', 'success');
      } else {
        showSnackbar('Failed to delete flash card.', 'error');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      showSnackbar('Failed to delete flash card.', 'error');
    }
    
    setConfirmDialogOpen(false);
    setCardToDelete(null);
  };
  
  // Save card from dialog
  const handleSaveCard = async () => {
    // Validation
    if (!dialogContent.content.trim()) {
      showSnackbar('Content is required.', 'error');
      return;
    }
    
    if (!dialogContent.sourceLanguage) {
      showSnackbar('Source language is required.', 'error');
      return;
    }
    
    try {
      // Parse tags
      const tags = dialogContent.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      if (editingCard) {
        // Update existing card
        const updatedCard = await window.api.updateFlashCard({
          ...editingCard,
          content: dialogContent.content,
          sourceLanguage: dialogContent.sourceLanguage,
          comment: dialogContent.comment || undefined,
          userTranslation: dialogContent.userTranslation || undefined,
          tags
        });
        
        // Update local state
        setCards(cards.map(card => card.id === updatedCard.id ? updatedCard : card));
        showSnackbar('Flash card updated successfully.', 'success');
      } else {
        // Create new card
        const newCard = await window.api.createFlashCard({
          content: dialogContent.content,
          sourceLanguage: dialogContent.sourceLanguage,
          comment: dialogContent.comment || undefined,
          userTranslation: dialogContent.userTranslation || undefined,
          tags
        });
        
        // Update local state
        setCards([...cards, newCard]);
        showSnackbar('Flash card created successfully.', 'success');
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving card:', error);
      showSnackbar('Failed to save flash card.', 'error');
    }
  };
  
  // Export database
  const handleExportDatabase = async () => {
    try {
      const success = await window.api.exportDatabase();
      
      if (success) {
        showSnackbar('Database exported successfully.', 'success');
      } else {
        showSnackbar('Failed to export database.', 'error');
      }
    } catch (error) {
      console.error('Error exporting database:', error);
      showSnackbar('Failed to export database.', 'error');
    }
  };
  
  // Import database
  const handleImportDatabase = async () => {
    try {
      const success = await window.api.importDatabase();
      
      if (success) {
        // Reload cards
        fetchCards();
        showSnackbar('Database imported successfully.', 'success');
      } else {
        showSnackbar('Failed to import database.', 'error');
      }
    } catch (error) {
      console.error('Error importing database:', error);
      showSnackbar('Failed to import database.', 'error');
    }
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
  
  // Get language name by code
  const getLanguageName = (code: string): string => {
    const language = LANGUAGES.find(lang => lang.code === code);
    return language ? language.name : code;
  };
  
  return (
    <Box>
      {/* Actions bar */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCard}
          >
            Add Card
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={handleImportDatabase}
          >
            Import
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportDatabase}
          >
            Export
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="language-filter-label">Language</InputLabel>
            <Select
              labelId="language-filter-label"
              value={selectedLanguage}
              label="Language"
              onChange={handleLanguageChange}
              size="small"
            >
              <MenuItem value="">
                <em>All Languages</em>
              </MenuItem>
              {LANGUAGES.map(lang => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="tag-filter-label">Tag</InputLabel>
            <Select
              labelId="tag-filter-label"
              value={selectedTag}
              label="Tag"
              onChange={handleTagChange}
              size="small"
            >
              <MenuItem value="">
                <em>All Tags</em>
              </MenuItem>
              {allTags.map(tag => (
                <MenuItem key={tag} value={tag}>
                  {tag}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
      </Box>
      
      {/* Content */}
      <Box>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="All Cards" />
        </Tabs>
        
        {filteredCards.length === 0 ? (
          <Alert severity="info">
            No flash cards found. {searchTerm || selectedLanguage || selectedTag ? 'Try adjusting your filters.' : 'Click "Add Card" to create your first card.'}
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Content</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Translation</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCards.map(card => (
                  <TableRow key={card.id}>
                    <TableCell sx={{ maxWidth: 300, wordBreak: 'break-word' }}>
                      <Typography variant="body1">
                        {card.content}
                      </Typography>
                      {card.comment && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {card.comment}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {getLanguageName(card.sourceLanguage)}
                    </TableCell>
                    <TableCell>
                      {card.tags.map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300, wordBreak: 'break-word' }}>
                      {card.userTranslation || '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditCard(card)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteClick(card.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      
      {/* Add/Edit Card Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCard ? 'Edit Flash Card' : 'Add Flash Card'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <TextField
              label="Content"
              multiline
              rows={3}
              fullWidth
              value={dialogContent.content}
              onChange={(e) => setDialogContent({ ...dialogContent, content: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Source Language</InputLabel>
              <Select
                value={dialogContent.sourceLanguage}
                label="Source Language"
                onChange={(e) => setDialogContent({ ...dialogContent, sourceLanguage: e.target.value })}
                required
              >
                {LANGUAGES.map(lang => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Comment (Optional)"
              fullWidth
              value={dialogContent.comment}
              onChange={(e) => setDialogContent({ ...dialogContent, comment: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              label="Translation (Optional)"
              fullWidth
              value={dialogContent.userTranslation}
              onChange={(e) => setDialogContent({ ...dialogContent, userTranslation: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              label="Tags (Comma Separated)"
              fullWidth
              value={dialogContent.tags}
              onChange={(e) => setDialogContent({ ...dialogContent, tags: e.target.value })}
              placeholder="e.g. noun, verb, common"
              InputProps={{
                startAdornment: <TagIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveCard} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Delete Flash Card</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this flash card? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default CardManagement;