const STRIPE_API_BASE = "https://api.stripe.com/v1";

export async function callStripe(path, options, secretKey) {
  const headers = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const body =
    options && options.body
      ? new URLSearchParams(options.body).toString()
      : undefined;

  const isPaymentOperation = path.includes("/payment_intents");
  const timeoutDuration = isPaymentOperation ? 60000 : 30000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

  try {
    const startTime = Date.now();
    console.log(
      `[Stripe API] Starting request: ${options?.method || "GET"} ${path}`
    );

    const res = await fetch(`${STRIPE_API_BASE}${path}`, {
      method: options?.method || "GET",
      headers,
      body,
      signal: controller.signal,
    });

    const elapsed = Date.now() - startTime;
    console.log(
      `[Stripe API] Response received in ${elapsed}ms: Status ${res.status}`
    );

    clearTimeout(timeoutId);

    let data;
    try {
      const text = await res.text();
      console.log(`[Stripe API] Response body:`, text.substring(0, 500));
      data = text ? JSON.parse(text) : {};
    } catch (jsonErr) {
      console.error("[Stripe API] JSON parse error:", jsonErr);
      throw new Error(
        `Invalid response from Stripe API (Status: ${res.status}). The server may be experiencing issues.`
      );
    }

    if (!res.ok) {
      const errorMessage =
        data.error?.message ||
        data.error?.type ||
        `Stripe API error (${res.status})`;
      const errorCode = data.error?.code ? ` (Code: ${data.error.code})` : "";
      const errorParam = data.error?.param
        ? ` (Parameter: ${data.error.param})`
        : "";

      let enhancedMessage = errorMessage;
      if (
        errorMessage.toLowerCase().includes("cashapp") ||
        errorMessage.toLowerCase().includes("cash app") ||
        errorCode.includes("payment_method_unavailable")
      ) {
        enhancedMessage = `${errorMessage}${errorCode}${errorParam}\n\n⚠️ Cash App Pay may not be enabled for your Stripe account. Please check your Stripe Dashboard → Settings → Payment methods to enable Cash App Pay.`;
      } else {
        enhancedMessage = `${errorMessage}${errorCode}${errorParam}`;
      }

      throw new Error(enhancedMessage);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("[Stripe API] Error details:", {
      path,
      method: options?.method || "GET",
      error: err.message,
      name: err.name,
      stack: err.stack,
    });

    if (err.name === "AbortError") {
      const operation = isPaymentOperation
        ? "payment operation"
        : "API request";
      let timeoutMessage = `Request timeout: The ${operation} took too long to complete (${
        timeoutDuration / 1000
      }s).\n\n`;

      if (isPaymentOperation) {
        timeoutMessage += `Possible causes:\n`;
        timeoutMessage += `1. Cash App Pay may not be enabled for your Stripe account\n`;
        timeoutMessage += `2. Network connectivity issues\n`;
        timeoutMessage += `3. Stripe API may be experiencing delays\n\n`;
        timeoutMessage += `Please check:\n`;
        timeoutMessage += `- Stripe Dashboard → Settings → Payment methods → Enable Cash App Pay\n`;
        timeoutMessage += `- Your network connection\n`;
        timeoutMessage += `- Browser console for detailed error logs`;
      } else {
        timeoutMessage += `Please check your network connection and try again.`;
      }

      throw new Error(timeoutMessage);
    }
    if (
      err.message &&
      !err.message.includes("Stripe API") &&
      !err.message.includes("timeout")
    ) {
      throw new Error(
        `Network error: ${err.message}. Please check your internet connection.`
      );
    }
    throw err;
  }
}

