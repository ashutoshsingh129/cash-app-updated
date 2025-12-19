import React from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  Grid,
  Chip,
  Alert,
  Box,
} from '@mui/material';
import { PaymentFormStyles } from './PaymentForm.styles';

const PaymentForm = ({
  stripeSecretKey,
  setStripeSecretKey,
  amount,
  setAmount,
  currency,
  setCurrency,
  routingType,
  setRoutingType,
  connectedAccounts,
  selectedAccount,
  setSelectedAccount,
  connectedAccountsLoading,
  connectedAccountsError,
  selectedAccountLabel,
  isPaying,
  onPay,
}) => {
  return (
    <PaymentFormStyles>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Cash App Pay Checkout (Stripe Connect)
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Frontend-only demo. Choose whether funds go to your platform account
            or a connected account via Stripe Connect.
          </Typography>

          <TextField
            fullWidth
            label="Stripe Secret Key"
            type="password"
            value={stripeSecretKey}
            onChange={(e) => setStripeSecretKey(e.target.value)}
            placeholder="sk_test_..."
            margin="normal"
            helperText="Enter your Stripe platform secret key. This must be your PLATFORM secret key so we can list connected accounts."
          />

          <FormControl component="fieldset" margin="normal" fullWidth>
            <FormLabel component="legend">Payment routing</FormLabel>
            <RadioGroup
              row
              value={routingType}
              onChange={(e) => setRoutingType(e.target.value)}
            >
              <FormControlLabel
                value="platform"
                control={<Radio />}
                label="Platform account (master account)"
              />
              <FormControlLabel
                value="connected"
                control={<Radio />}
                label="Connected account"
              />
            </RadioGroup>
            <FormHelperText>
              {routingType === "platform"
                ? "Funds will be routed directly to your Stripe platform (master) account."
                : "Funds will be routed to the selected connected account via Stripe Connect."}
            </FormHelperText>
          </FormControl>

          {routingType === "connected" && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Connected account</InputLabel>
              <Select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                disabled={connectedAccountsLoading || connectedAccounts.length === 0}
                label="Connected account"
              >
                {connectedAccountsLoading && (
                  <MenuItem value="">
                    <em>Loading connected accounts...</em>
                  </MenuItem>
                )}
                {!connectedAccountsLoading &&
                  connectedAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.label} ({acc.id})
                    </MenuItem>
                  ))}
                {!connectedAccountsLoading && connectedAccounts.length === 0 && (
                  <MenuItem value="">
                    <em>No connected accounts found for this platform key</em>
                  </MenuItem>
                )}
              </Select>
              <FormHelperText>
                This is the Stripe Connect account that will receive the funds.
              </FormHelperText>
              {connectedAccountsError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {connectedAccountsError}
                </Alert>
              )}
            </FormControl>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Currency</InputLabel>
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  label="Currency"
                >
                  <MenuItem value="usd">USD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Payment method
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                }}
              />
              <Chip
                label="Cash App Pay (QR code)"
                color="success"
                variant="outlined"
              />
            </Box>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              Customer (Cash App) →{" "}
              {routingType === "platform"
                ? "Platform Account"
                : `Connected Account (${selectedAccountLabel || selectedAccount || "select one"})`}
              .
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={onPay}
            disabled={isPaying || (routingType === "connected" && !selectedAccount)}
            sx={{ mt: 2 }}
          >
            {isPaying ? "Creating Cash App payment..." : "Pay using Cash App"}
          </Button>
        </CardContent>
      </Card>
    </PaymentFormStyles>
  );
};

export default PaymentForm;
