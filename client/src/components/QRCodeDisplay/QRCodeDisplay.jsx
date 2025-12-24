import React, { useRef, useEffect } from 'react';
import { Box, Typography, Link, Paper } from '@mui/material';
import { formatExpiresAt } from '../../utils/formatters';
import { QRCodeDisplayStyles } from './QRCodeDisplay.styles';

// Completely isolated image component that sets src once and never changes it
// This component NEVER re-renders - it's completely memoized
const StableQRImage = React.memo(({ src }) => {
  const imgRef = useRef(null);
  const srcSetRef = useRef(false);
  const lockedSrcRef = useRef(null);

  // Lock the src once it's provided - this happens during render, not in effect
  if (src && !lockedSrcRef.current) {
    lockedSrcRef.current = src;
  }

  useEffect(() => {
    // Set src only once when component mounts - this is the ONLY time src is set
    if (lockedSrcRef.current && imgRef.current && !srcSetRef.current) {
      const imgElement = imgRef.current;
      
      // Set src directly on DOM element - this is the ONLY time it's set
      imgElement.src = lockedSrcRef.current;
      srcSetRef.current = true;
      
      console.log('QR image src set once, will never change:', lockedSrcRef.current.substring(0, 50));
      
      // Store original src in data attribute as backup
      imgElement.setAttribute('data-qr-src', lockedSrcRef.current);
      
      // Prevent any future src changes by intercepting property setter
      let currentSrc = lockedSrcRef.current;
      Object.defineProperty(imgElement, 'src', {
        get: () => currentSrc,
        set: (newSrc) => {
          // Only allow setting if it's the same URL (browser might try to reload)
          if (newSrc === currentSrc || newSrc === lockedSrcRef.current) {
            currentSrc = newSrc;
          } else {
            console.warn('Attempted to change QR image src - blocked:', newSrc.substring(0, 50));
            // Don't change src - keep the original
          }
        },
        configurable: false,
      });
      
      // Add error handler to prevent reload attempts
      imgElement.onerror = () => {
        console.warn('QR image failed to load, but preventing reload');
        // Don't try to reload
      };
    }
  }, []); // Empty deps - only run once on mount

  if (!lockedSrcRef.current) return null;

  return (
    <img
      ref={imgRef}
      key="stable-qr-image" // Stable key ensures React never recreates this element
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
      // Don't set src as prop - it's set via ref in useEffect
    />
  );
}, () => true); // Always return true to prevent ANY re-renders

const QRCodeDisplay = React.memo(({
  qrImage,
  redirectUrl,
  qrExpiresAt,
  paymentIntentId,
  isMobile,
}) => {
  // Lock the image source once it's set - never change it
  const lockedQrImageRef = useRef(null);
  const lockedRedirectUrlRef = useRef(null);
  
  // Lock values once they're set (only happens once per component instance)
  // Accept both Base64 (starts with data:) and URLs
  if (qrImage && !lockedQrImageRef.current) {
    lockedQrImageRef.current = qrImage;
    const isBase64 = qrImage.startsWith('data:');
    console.log('QR image locked:', isBase64 ? 'Base64' : 'URL');
  }
  
  if (redirectUrl && !lockedRedirectUrlRef.current) {
    lockedRedirectUrlRef.current = redirectUrl;
  }

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
                <Typography variant="body2" color="text.secondary">
                  Expires at: {formatExpiresAt(qrExpiresAt)}
                </Typography>
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
    return (
      <QRCodeDisplayStyles>
        <Paper elevation={2} sx={{ p: 3, mt: 2, textAlign: 'center' }}>
          <StableQRImage src={lockedQrImageRef.current} />
          <Typography variant="body1" gutterBottom>
            Ask the customer to scan this QR code with Cash App to complete the payment.
          </Typography>
          {qrExpiresAt && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Expires at: {formatExpiresAt(qrExpiresAt)}
              </Typography>
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
              <Typography variant="body2" color="text.secondary">
                Expires at: {formatExpiresAt(qrExpiresAt)}
              </Typography>
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
  // CRITICAL: Once qrImage is set, NEVER re-render this component
  // This prevents the image from reloading
  
  // If qrImage changes from empty to set, allow re-render
  const qrImageJustSet = !prevProps.qrImage && nextProps.qrImage;
  if (qrImageJustSet) {
    return false; // Allow re-render when QR image is first set
  }
  
  // If qrImage is set, never re-render (prevent any prop changes from causing re-renders)
  if (prevProps.qrImage && nextProps.qrImage) {
    return true; // Skip ALL re-renders once QR image exists
  }
  
  // Before QR image is set, allow re-renders for prop changes
  return (
    prevProps.redirectUrl === nextProps.redirectUrl &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.qrExpiresAt === nextProps.qrExpiresAt &&
    prevProps.paymentIntentId === nextProps.paymentIntentId
  );
});

QRCodeDisplay.displayName = 'QRCodeDisplay';

export default QRCodeDisplay;
