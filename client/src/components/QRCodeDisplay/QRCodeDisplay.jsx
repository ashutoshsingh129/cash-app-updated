import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Box, Typography, Link, Paper } from '@mui/material';
import { formatExpiresAt } from '../../utils/formatters';
import { QRCodeDisplayStyles } from './QRCodeDisplay.styles';

// Completely isolated image component that uses a stable key to prevent re-mounting
// This prevents the QR code from flashing when parent components update
const QRCodeImage = ({ src }) => {
  if (!src) return null;

  // Use the src as a key to ensure React treats it as the same element
  // Once mounted with a key, React won't remount it unless the key changes
  return (
    <Box
      component="img"
      key={src}
      src={src}
      alt="Cash App QR code"
      loading="eager"
      sx={{
        width: 220,
        height: 220,
        borderRadius: 2,
        mb: 2,
        display: 'block',
        margin: '0 auto',
        objectFit: 'contain',
      }}
    />
  );
};

const QRCodeDisplay = React.memo(({
  qrImage,
  redirectUrl,
  qrExpiresAt,
  timeRemaining,
  paymentIntentId,
  isMobile,
}) => {
  // Use refs to lock values once they're first set - prevents re-renders from changing them
  const lockedQrImageRef = useRef(null);
  const lockedRedirectUrlRef = useRef(null);
  
  // Lock values once they're set (only happens once per component instance)
  if (qrImage && !lockedQrImageRef.current) {
    lockedQrImageRef.current = qrImage;
  }
  if (redirectUrl && !lockedRedirectUrlRef.current) {
    lockedRedirectUrlRef.current = redirectUrl;
  }

  // No longer needed - we set src directly in JSX now

  if (isMobile) {
    if (lockedRedirectUrlRef.current) {
      return (
        <QRCodeDisplayStyles>
          <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Payment Link:
            </Typography>
            <Link
              href={lockedRedirectUrlRef.current}
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

  if (lockedQrImageRef.current) {
    // Use the locked URL directly - it won't change once set
    const stableImageUrl = lockedQrImageRef.current;
    
    return (
      <QRCodeDisplayStyles>
        <Paper elevation={2} sx={{ p: 3, mt: 2, textAlign: 'center' }}>
          {/* Use a stable key based on the URL to prevent React from recreating the element */}
          <img
            key={`qr-${stableImageUrl}`}
            src={stableImageUrl}
            alt="Cash App QR code"
            style={{
              width: 220,
              height: 220,
              borderRadius: 8,
              marginBottom: 16,
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
              objectFit: 'contain',
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
  } else if (lockedRedirectUrlRef.current) {
    return (
      <QRCodeDisplayStyles>
        <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Desktop Payment Link:
          </Typography>
          <Link
            href={lockedRedirectUrlRef.current}
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
}, (prevProps, nextProps) => {
  // Only re-render if qrImage, redirectUrl, or isMobile actually changed
  // Ignore timeRemaining changes to prevent unnecessary re-renders and image reloads
  // This prevents the QR code from flashing when status updates from polling
  const propsChanged = (
    prevProps.qrImage !== nextProps.qrImage ||
    prevProps.redirectUrl !== nextProps.redirectUrl ||
    prevProps.isMobile !== nextProps.isMobile ||
    prevProps.qrExpiresAt !== nextProps.qrExpiresAt ||
    prevProps.paymentIntentId !== nextProps.paymentIntentId
  );
  
  // Return true if props are equal (skip re-render), false if different (re-render)
  return !propsChanged;
});

QRCodeDisplay.displayName = 'QRCodeDisplay';

export default QRCodeDisplay;

