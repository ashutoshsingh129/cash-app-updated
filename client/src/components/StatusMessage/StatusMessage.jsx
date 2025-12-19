import React from 'react';
import { Alert, AlertTitle } from '@mui/material';

const StatusMessage = ({ status, statusType }) => {
  if (!status) return null;

  const severity = statusType === 'success' ? 'success' : statusType === 'error' ? 'error' : 'info';

  return (
    <Alert severity={severity} sx={{ mt: 2 }}>
      {status}
    </Alert>
  );
};

export default StatusMessage;

