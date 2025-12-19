import React from 'react';
import { Box, Typography, Link, Paper } from '@mui/material';
import { formatExpiresAt } from '../../utils/formatters';
import { QRCodeDisplayStyles } from './QRCodeDisplay.styles';

const QRCodeDisplay = ({
  qrImage,
  redirectUrl,
  qrExpiresAt,
  timeRemaining,
  paymentIntentId,
  isMobile,
}) => {
  if (isMobile) {
    if (redirectUrl) {
      return (
        <QRCodeDisplayStyles>
          <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Payment Link:
            </Typography>
            <Link
              href={redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'inline-block',
                mt: 2,
                p: 2,
                backgroundColor: '#00D632',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 2,
                fontWeight: 'bold',
                fontSize: '1rem',
                minWidth: 200,
                textAlign: 'center',
                '&:hover': {
                  backgroundColor: '#00B82A',
                },
              }}
            >
              Click here to pay with Cash App
            </Link>
            <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
              Tap the link above to complete your payment
            </Typography>
            {qrExpiresAt && (
              <Box sx={{ mt: 2 }}>
                {timeRemaining && !timeRemaining.expired ? (
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        timeRemaining.totalSeconds < 60
                          ? 'error.main'
                          : timeRemaining.totalSeconds < 300
                          ? 'warning.main'
                          : 'success.main',
                      fontWeight: 'bold',
                    }}
                  >
                    Link expires in: {timeRemaining.minutes}m {timeRemaining.seconds}s
                  </Typography>
                ) : timeRemaining?.expired ? (
                  <Typography variant="body2" color="error" fontWeight="bold">
                    ⚠️ Payment link has expired. Please generate a new payment.
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    Link expires at: {formatExpiresAt(qrExpiresAt)}
                  </Typography>
                )}
              </Box>
            )}
            {paymentIntentId && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                PaymentIntent: {paymentIntentId}
              </Typography>
            )}
          </Paper>
        </QRCodeDisplayStyles>
      );
    } else {
      return (
        <QRCodeDisplayStyles>
          <Paper elevation={2} sx={{ p: 3, mt: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="h6" fontWeight="bold">
              ⚠️ Payment Link Not Available
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Stripe did not provide a payment link for mobile devices. Please check the browser console for details.
              <br />
              <br />
              Expected field: <code>hosted_voucher_url</code>
              <br />
              Please check your Stripe Dashboard or contact support.
            </Typography>
            {paymentIntentId && (
              <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
                PaymentIntent: {paymentIntentId}
              </Typography>
            )}
          </Paper>
        </QRCodeDisplayStyles>
      );
    }
  }

  if (qrImage) {
    return (
      <QRCodeDisplayStyles>
        <Paper elevation={2} sx={{ p: 3, mt: 2, textAlign: 'center' }}>
          <Box
            component="img"
            src={qrImage}
            alt="Cash App QR code"
            sx={{
              width: 220,
              height: 220,
              borderRadius: 2,
              mb: 2,
            }}
          />
          <Typography variant="body1" gutterBottom>
            Ask the customer to scan this QR code with Cash App to complete the payment.
          </Typography>
          {qrExpiresAt && (
            <Box sx={{ mt: 2 }}>
              {timeRemaining && !timeRemaining.expired ? (
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      timeRemaining.totalSeconds < 60
                        ? 'error.main'
                        : timeRemaining.totalSeconds < 300
                        ? 'warning.main'
                        : 'success.main',
                    fontWeight: 'bold',
                  }}
                >
                  Time remaining: {timeRemaining.minutes}m {timeRemaining.seconds}s
                </Typography>
              ) : timeRemaining?.expired ? (
                <Typography variant="body2" color="error" fontWeight="bold">
                  ⚠️ QR code has expired. Please generate a new payment.
                </Typography>
              ) : (
                <Typography variant="body2">
                  Expires at: {formatExpiresAt(qrExpiresAt)}
                </Typography>
              )}
            </Box>
          )}
          {paymentIntentId && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              PaymentIntent: {paymentIntentId}
            </Typography>
          )}
        </Paper>
      </QRCodeDisplayStyles>
    );
  } else if (redirectUrl) {
    return (
      <QRCodeDisplayStyles>
        <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Desktop Payment Link:
          </Typography>
          <Link
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'inline-block',
              mt: 2,
              p: 1.5,
              backgroundColor: '#00D632',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 1,
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#00B82A',
              },
            }}
          >
            Click here to pay with Cash App
          </Link>
          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
            For customers on desktop without mobile app access
          </Typography>
          {qrExpiresAt && (
            <Box sx={{ mt: 2 }}>
              {timeRemaining && !timeRemaining.expired ? (
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      timeRemaining.totalSeconds < 60
                        ? 'error.main'
                        : timeRemaining.totalSeconds < 300
                        ? 'warning.main'
                        : 'success.main',
                    fontWeight: 'bold',
                  }}
                >
                  Link expires in: {timeRemaining.minutes}m {timeRemaining.seconds}s
                </Typography>
              ) : timeRemaining?.expired ? (
                <Typography variant="body2" color="error" fontWeight="bold">
                  ⚠️ Payment link has expired. Please generate a new payment.
                </Typography>
              ) : (
                <Typography variant="body2">
                  Link expires at: {formatExpiresAt(qrExpiresAt)}
                </Typography>
              )}
            </Box>
          )}
          {paymentIntentId && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              PaymentIntent: {paymentIntentId}
            </Typography>
          )}
        </Paper>
      </QRCodeDisplayStyles>
    );
  }

  return null;
};

export default QRCodeDisplay;

