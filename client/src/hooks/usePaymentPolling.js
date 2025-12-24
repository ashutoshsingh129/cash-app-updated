import { useEffect, useRef, useCallback } from 'react';
import { callStripe } from '../services/stripeApi';

export function usePaymentPolling(paymentIntentId, routingType, stripeSecretKey, setStatus, setStatusType) {
  const pollCountRef = useRef(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const initialDelayRef = useRef(null);
  const isCancelledRef = useRef(false);
  
  // Store latest values in refs to avoid stale closures
  const routingTypeRef = useRef(routingType);
  const stripeSecretKeyRef = useRef(stripeSecretKey);
  const setStatusRef = useRef(setStatus);
  const setStatusTypeRef = useRef(setStatusType);
  const paymentIntentIdRef = useRef(paymentIntentId);

  // Update refs when values change
  useEffect(() => {
    routingTypeRef.current = routingType;
    stripeSecretKeyRef.current = stripeSecretKey;
    setStatusRef.current = setStatus;
    setStatusTypeRef.current = setStatusType;
    paymentIntentIdRef.current = paymentIntentId;
  }, [routingType, stripeSecretKey, setStatus, setStatusType, paymentIntentId]);

  useEffect(() => {
    console.log('usePaymentPolling effect running, paymentIntentId:', paymentIntentId);
    
    // Clear any existing polling first
    if (intervalRef.current) {
      console.log('Clearing existing interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      console.log('Clearing existing timeout');
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (initialDelayRef.current) {
      console.log('Clearing existing initial delay');
      clearTimeout(initialDelayRef.current);
      initialDelayRef.current = null;
    }

    if (!paymentIntentId) {
      pollCountRef.current = 0;
      startTimeRef.current = null;
      isCancelledRef.current = false;
      return;
    }

    isCancelledRef.current = false;
    pollCountRef.current = 0;
    startTimeRef.current = Date.now();
    const POLL_INTERVAL = 6000; // 6 seconds - recommended by Stripe for payment status checks
    const INITIAL_DELAY = 5 * 60 * 1000; // 5 minutes delay before starting to poll
    const MAX_POLL_COUNT = 50; // Maximum 50 polls (5 minutes at 6 second intervals)
    const MAX_POLL_DURATION = 10 * 60 * 1000; // 10 minutes total (5 min delay + 5 min polling)

    const stopPolling = (reason = '') => {
      isCancelledRef.current = true;
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current);
        initialDelayRef.current = null;
      }
      if (intervalRef.current) {
        console.log(`Stopping polling${reason ? ' - ' + reason : ''}`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // Set a maximum timeout to stop polling after total duration
    timeoutRef.current = setTimeout(() => {
      if (!isCancelledRef.current) {
        stopPolling('timeout reached');
        setStatusTypeRef.current("warning");
        setStatusRef.current("Payment polling timeout. Please check the payment status manually in your Stripe dashboard.");
        console.warn("Payment polling stopped due to timeout");
      }
    }, MAX_POLL_DURATION);

    // Delay initial poll by 5 minutes before starting to poll
    initialDelayRef.current = setTimeout(() => {
      if (isCancelledRef.current) {
        return;
      }
      
      console.log(`Starting polling interval with ${POLL_INTERVAL}ms delay for payment intent: ${paymentIntentId}`);
      
      // Start the polling interval
      intervalRef.current = setInterval(async () => {
        if (isCancelledRef.current) {
          return;
        }

        const currentPaymentIntentId = paymentIntentIdRef.current;
        const currentSecretKey = stripeSecretKeyRef.current;
        
        if (!currentPaymentIntentId || !currentSecretKey) {
          return;
        }

        pollCountRef.current++;
        const elapsedTime = Date.now() - startTimeRef.current;

      // Stop polling if we've exceeded max polls or max duration
      if (pollCountRef.current > MAX_POLL_COUNT || elapsedTime > MAX_POLL_DURATION) {
        stopPolling('max duration/count reached');
        if (!isCancelledRef.current) {
          setStatusTypeRef.current("warning");
          setStatusRef.current("Payment polling timeout. Please check the payment status manually in your Stripe dashboard.");
        }
        return;
      }

      try {
        console.log(`Polling payment intent: ${currentPaymentIntentId} (poll #${pollCountRef.current})`);
        const pi = await callStripe(`/payment_intents/${currentPaymentIntentId}`, {}, currentSecretKey);
        if (isCancelledRef.current) {
          return;
        }

        console.log("PaymentIntent status check:", {
          id: pi.id,
          status: pi.status,
          last_payment_error: pi.last_payment_error,
          charges: pi.charges?.data?.length || 0,
          pollCount: pollCountRef.current,
          elapsedTime: Math.round(elapsedTime / 1000) + 's',
        });

        // Terminal states - stop polling immediately
        if (pi.status === "succeeded") {
          stopPolling('payment succeeded');
          setStatusTypeRef.current("success");
          const destination =
            routingTypeRef.current === "platform"
              ? "platform account"
              : "connected account";
          setStatusRef.current(
            `Payment succeeded and funds are on the way to the ${destination}.`
          );
          return; // Exit immediately after stopping
        } else if (
          pi.status === "canceled" ||
          pi.status === "requires_payment_method" ||
          pi.status === "payment_failed"
        ) {
          stopPolling(`payment ${pi.status}`);
          setStatusTypeRef.current("error");
          let errorMessage = `Payment failed or was canceled (status: ${pi.status}).`;

          if (pi.last_payment_error) {
            const error = pi.last_payment_error;
            errorMessage += `\n\nError: ${error.message || "Unknown error"}`;
            if (error.code) {
              errorMessage += `\nError Code: ${error.code}`;
            }
            if (error.decline_code) {
              errorMessage += `\nDecline Code: ${error.decline_code}`;
            }
            console.error("Payment error details:", error);
          }

          setStatusRef.current(errorMessage);
        }
      } catch (err) {
        if (!isCancelledRef.current) {
          console.error("Error polling PaymentIntent:", err);
        }
      }
      }, POLL_INTERVAL);
    }, INITIAL_DELAY); // 5 minute delay before starting to poll

    return () => {
      console.log('usePaymentPolling cleanup - stopping polling');
      stopPolling('component unmount/effect cleanup');
      pollCountRef.current = 0;
      startTimeRef.current = null;
    };
  }, [paymentIntentId]); // Only depend on paymentIntentId
}

