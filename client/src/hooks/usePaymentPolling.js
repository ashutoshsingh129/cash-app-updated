import { useEffect } from 'react';
import { callStripe } from '../services/stripeApi';

export function usePaymentPolling(paymentIntentId, routingType, stripeSecretKey, setStatus, setStatusType) {
  useEffect(() => {
    if (!paymentIntentId) {
      return;
    }

    let isCancelled = false;
    const interval = setInterval(async () => {
      try {
        const pi = await callStripe(`/payment_intents/${paymentIntentId}`, {}, stripeSecretKey);
        if (isCancelled) {
          return;
        }

        console.log("PaymentIntent status check:", {
          id: pi.id,
          status: pi.status,
          last_payment_error: pi.last_payment_error,
          charges: pi.charges?.data?.length || 0,
        });

        if (pi.status === "succeeded") {
          setStatusType("success");
          const destination =
            routingType === "platform"
              ? "platform account"
              : "connected account";
          setStatus(
            `Payment succeeded and funds are on the way to the ${destination}.`
          );
          clearInterval(interval);
        } else if (
          pi.status === "canceled" ||
          pi.status === "requires_payment_method"
        ) {
          setStatusType("error");
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

          setStatus(errorMessage);
          clearInterval(interval);
        }
      } catch (err) {
        if (!isCancelled) {
          setStatusType("error");
          setStatus(err.message || "Error polling PaymentIntent.");
          console.error("Error polling PaymentIntent:", err);
        }
      }
    }, 4000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [paymentIntentId, routingType, stripeSecretKey, setStatus, setStatusType]);
}

