import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitIcon,
} from '@mui/icons-material';
import { useSettings } from '../context/SettingsContext';

interface HeaderProps {
  isSessionActive: boolean;
  endSession: () => void;
}

/**
 * Application header component
 */
const Header: React.FC<HeaderProps> = ({ isSessionActive, endSession }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, updateSettings } = useSettings();
  
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode });
    handleMenuClose();
  };
  
  // Navigate to a route
  const navigateTo = (route: string) => {
    navigate(route);
    handleMenuClose();
  };
  
  // Show end session confirmation
  const showEndSessionConfirm = () => {
    setConfirmDialogOpen(true);
    handleMenuClose();
  };
  
  // Handle end session confirmation
  const handleEndSession = () => {
    setConfirmDialogOpen(false);
    endSession();
    navigate('/');
  };
  
  // Get title based on current route
  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Language Selection';
      case '/practice':
        return 'Practice Session';
      case '/cards':
        return 'Card Management';
      case '/settings':
        return 'Settings';
      default:
        return 'FlashCards Desktop';
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {getTitle()}
          </Typography>
          
          {isSessionActive && (
            <Button 
              color="inherit" 
              startIcon={<ExitIcon />}
              onClick={showEndSessionConfirm}
            >
              End Session
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      {/* App Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => navigateTo('/')}>Home</MenuItem>
        <MenuItem onClick={() => navigateTo('/cards')}>Manage Cards</MenuItem>
        <MenuItem onClick={() => navigateTo('/settings')}>Settings</MenuItem>
        <MenuItem onClick={toggleDarkMode}>
          {settings.darkMode ? (
            <>
              <LightModeIcon fontSize="small" sx={{ mr: 1 }} />
              Light Mode
            </>
          ) : (
            <>
              <DarkModeIcon fontSize="small" sx={{ mr: 1 }} />
              Dark Mode
            </>
          )}
        </MenuItem>
      </Menu>
      
      {/* End Session Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>End Session?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to end the current practice session? Your progress will not be saved.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleEndSession} color="error">
            End Session
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Header;