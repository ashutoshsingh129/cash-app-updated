import { useState, useMemo, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Container, Box, CircularProgress, Alert } from "@mui/material";
import PaymentForm from "./components/PaymentForm/PaymentForm";
import StatusMessage from "./components/StatusMessage/StatusMessage";
import QRCodeDisplay from "./components/QRCodeDisplay/QRCodeDisplay";
import Login from "./components/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import StripeKeysForm from "./components/StripeKeysForm/StripeKeysForm";
import Navbar from "./components/Navbar/Navbar";
import { useConnectedAccounts } from "./hooks/useConnectedAccounts";
// Payment polling disabled - QR code is displayed once without status checking
// import { usePaymentPolling } from "./hooks/usePaymentPolling";
import { useMobileDevice } from "./hooks/useMobileDevice";
import { useStripeKeys } from "./hooks/useStripeKeys";
import { useAuth } from "./context/AuthContext";
import { callStripe } from "./services/stripeApi";
import { formatExpiresAt } from "./utils/formatters";

function App() {
  const [amount, setAmount] = useState("10.00");
  const [currency, setCurrency] = useState("usd");
  const [routingType, setRoutingType] = useState("connected");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [qrImageBase64, setQrImageBase64] = useState("");
  const [qrExpiresAt, setQrExpiresAt] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");

  const isMobile = useMobileDevice();

  const {
    stripeSecretKey,
    hasKeys,
    loading: keysLoading,
    error: keysError,
    refreshKeys,
  } = useStripeKeys();

  const {
    connectedAccounts,
    connectedAccountsLoading,
    connectedAccountsError,
  } = useConnectedAccounts(stripeSecretKey || "");

  // Payment polling disabled - QR code is displayed once and no status checking is done
  // usePaymentPolling(paymentIntentId, routingType, stripeSecretKey || "", setStatus, setStatusType);

  const selectedAccountLabel = useMemo(() => {
    return connectedAccounts.find((a) => a.id === selectedAccount)?.label || "";
  }, [selectedAccount, connectedAccounts]);

  const handlePay = async () => {
    if (!stripeSecretKey || !stripeSecretKey.startsWith("sk_")) {
      setStatusType("error");
      setStatus("Please configure your Stripe keys first.");
      return;
    }

    // Clear any previous payment state
    setPaymentIntentId("");

    if (routingType === "connected" && !selectedAccount) {
      alert("Please choose a connected account.");
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    const amountInSmallestUnit = Math.round(numericAmount * 100);

    setIsPaying(true);
    setStatusType("info");
    setStatus("Creating Cash App PaymentIntent on Stripe...");
    setQrImageBase64("");
    setQrExpiresAt(null);
    setRedirectUrl("");
    setPaymentIntentId("");

    try {
      const paymentIntentBody = {
        amount: String(amountInSmallestUnit),
        currency,
        "payment_method_types[]": "cashapp",
        statement_descriptor: "Cash App Payment",
        statement_descriptor_suffix: "CashAppPay",
      };

      if (routingType === "connected" && selectedAccount) {
        paymentIntentBody.on_behalf_of = selectedAccount;
      }

      console.log("Creating PaymentIntent with body:", paymentIntentBody);
      console.log("Routing type:", routingType);
      if (routingType === "connected") {
        console.log("Selected connected account:", selectedAccount);
      } else {
        console.log("Routing to platform account (master account)");
      }

      const startTime = Date.now();

      const pi = await callStripe(
        "/payment_intents",
        {
        method: "POST",
        body: paymentIntentBody,
        },
        stripeSecretKey
      );

      console.log(
        "PaymentIntent created successfully in",
        Date.now() - startTime,
        "ms"
      );
      console.log("PaymentIntent ID:", pi.id);
      console.log("PaymentIntent status:", pi.status);

      setStatus("Confirming Cash App payment and generating QR code...");

      const returnUrl = `${
        window.location.origin
      }${window.location.pathname.replace(/\/$/, "")}/cash-app-return`;
      console.log("Using return_url:", returnUrl);

      const confirmed = await callStripe(
        `/payment_intents/${pi.id}/confirm`,
        {
        method: "POST",
        body: {
          "payment_method_data[type]": "cashapp",
          return_url: returnUrl,
          },
        },
        stripeSecretKey
      );

      console.log("PaymentIntent confirmed:", {
        id: confirmed.id,
        status: confirmed.status,
        next_action_type: confirmed.next_action?.type,
      });

      setPaymentIntentId(confirmed.id);

      const nextAction = confirmed.next_action;

      if (
        nextAction &&
        nextAction.type === "cashapp_handle_redirect_or_display_qr_code" &&
        nextAction.cashapp_handle_redirect_or_display_qr_code
      ) {
        const cashAppAction = nextAction.cashapp_handle_redirect_or_display_qr_code;

        if (cashAppAction.qr_code) {
          const qrCode = cashAppAction.qr_code;
          const imageUrl = qrCode.image_url_png;
          setQrExpiresAt(qrCode.expires_at);
          console.log("QR code expiration timestamp:", qrCode.expires_at);
          console.log("QR code expires at:", formatExpiresAt(qrCode.expires_at));
          
          // Use the QR code URL directly - the component will lock it and prevent reloads
          // This avoids CORS issues with fetch/canvas conversion
          setQrImageBase64(imageUrl);
          console.log("QR code URL set - component will display it once without reloading");
        }

        const redirectUrlValue = 
          cashAppAction.hosted_voucher_url || 
          cashAppAction.redirect_url || 
          cashAppAction.url ||
          cashAppAction.mobile_url;
        
        if (redirectUrlValue) {
          setRedirectUrl(redirectUrlValue);
          console.log("Redirect URL set:", redirectUrlValue);
        } else {
          console.warn(
            "No redirect URL found in cashAppAction. Available fields:",
            Object.keys(cashAppAction)
          );
          console.warn(
            "Full cashAppAction:",
            JSON.stringify(cashAppAction, null, 2)
          );
        }

        console.log("Full cashAppAction:", JSON.stringify(cashAppAction, null, 2));
        console.log("Device detection:", {
          isMobile,
          hasQRCode: !!cashAppAction.qr_code,
          hasRedirectUrl: !!cashAppAction.hosted_voucher_url,
          userAgent: navigator.userAgent,
          windowWidth: window.innerWidth,
          isTouchDevice: "ontouchstart" in window,
        });

        setStatusType("info");
        
        // Set status message - no polling, just display QR code once
        if (isMobile && cashAppAction.hosted_voucher_url) {
          setStatus(
            "Cash App payment ready! Click the link below to complete the payment."
          );
        } else if (!isMobile && cashAppAction.qr_code) {
          setStatus(
            "QR code generated. Ask the customer to scan the Cash App QR code with their mobile device."
          );
        } else if (cashAppAction.qr_code && cashAppAction.hosted_voucher_url) {
          setStatus(
            isMobile
              ? "Cash App payment ready! Click the link below to complete the payment."
              : "QR code generated. Scan the QR code with your mobile device."
          );
        } else if (cashAppAction.qr_code) {
          setStatus(
            isMobile
              ? "Cash App payment ready! A payment link should appear below."
              : "QR code generated. Ask the customer to scan the Cash App QR code."
          );
        } else if (cashAppAction.hosted_voucher_url) {
          setStatus(
            "Cash App payment ready! Click the link below to complete the payment."
          );
        } else {
          setStatusType("error");
          setStatus("No Cash App payment method returned from Stripe.");
        }
      } else {
        setStatusType("error");
        setStatus("No Cash App payment method returned from Stripe.");
      }
    } catch (err) {
      setStatusType("error");
      setStatus(err.message || "Unexpected error while creating payment.");
    } finally {
      setIsPaying(false);
    }
  };


  const CashAppPayPage = () => {
    if (keysLoading) {
      return (
        <>
          <Navbar />
          <Box
            sx={{
              minHeight: "calc(100vh - 64px)",
              backgroundColor: "background.default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        </>
      );
    }

    if (!hasKeys) {
      return (
        <>
          <Navbar />
          <Box
            sx={{
              minHeight: "calc(100vh - 64px)",
              backgroundColor: "background.default",
              py: 4,
            }}
          >
            <Container maxWidth="md">
              {keysError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {keysError}
                </Alert>
              )}
              <StripeKeysForm
                onSuccess={() => {
                  refreshKeys();
                }}
                onError={(error) => {
                  console.error("Error saving keys:", error);
                }}
              />
            </Container>
          </Box>
        </>
      );
    }

    return (
      <>
        <Navbar />
        <Box
          sx={{
            minHeight: "calc(100vh - 64px)",
            backgroundColor: "background.default",
            py: 4,
          }}
        >
          <Container maxWidth="md">
            <PaymentForm
              amount={amount}
              setAmount={setAmount}
              currency={currency}
              setCurrency={setCurrency}
              routingType={routingType}
              setRoutingType={setRoutingType}
              connectedAccounts={connectedAccounts}
              selectedAccount={selectedAccount}
              setSelectedAccount={setSelectedAccount}
              connectedAccountsLoading={connectedAccountsLoading}
              connectedAccountsError={connectedAccountsError}
              selectedAccountLabel={selectedAccountLabel}
              isPaying={isPaying}
              onPay={handlePay}
            />
            <QRCodeDisplay
              qrImage={qrImageBase64}
              redirectUrl={redirectUrl}
              qrExpiresAt={qrExpiresAt}
              paymentIntentId={paymentIntentId}
              isMobile={isMobile}
            />
            <StatusMessage 
              status={status} 
              statusType={statusType}
            />
          </Container>
        </Box>
      </>
    );
  };

  const { login, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login onLogin={login} />
          )
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <CashAppPayPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
