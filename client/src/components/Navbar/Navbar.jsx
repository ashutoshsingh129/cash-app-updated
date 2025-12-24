import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Settings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { NavbarStyles } from './Navbar.styles';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [clearKeysDialogOpen, setClearKeysDialogOpen] = useState(false);
  const [isClearingKeys, setIsClearingKeys] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const handleClearKeys = async () => {
    setIsClearingKeys(true);
    try {
      const result = await apiService.clearStripeKeys();
      if (result.success) {
        setClearKeysDialogOpen(false);
        handleMenuClose();
        window.location.reload();
      } else {
        console.error('Failed to clear keys:', result.message);
        alert('Failed to clear keys: ' + result.message);
      }
    } catch (error) {
      console.error('Error clearing keys:', error);
      alert('Error clearing keys: ' + error.message);
    } finally {
      setIsClearingKeys(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <NavbarStyles>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
            Cash App Pay
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.email || 'User'}</Typography>
            </MenuItem>
            <MenuItem onClick={() => setClearKeysDialogOpen(true)}>
              <Settings sx={{ mr: 1 }} />
              Remove Keys
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Dialog
        open={clearKeysDialogOpen}
        onClose={() => setClearKeysDialogOpen(false)}
        aria-labelledby="clear-keys-dialog-title"
      >
        <DialogTitle id="clear-keys-dialog-title">Remove Configured Keys</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove all configured Stripe keys? You will need to
            reconfigure them to use the payment features.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearKeysDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleClearKeys}
            color="error"
            variant="contained"
            disabled={isClearingKeys}
          >
            {isClearingKeys ? 'Removing...' : 'Remove Keys'}
          </Button>
        </DialogActions>
      </Dialog>
    </NavbarStyles>
  );
};

export default Navbar;

