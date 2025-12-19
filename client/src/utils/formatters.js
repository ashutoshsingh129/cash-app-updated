export function formatExpiresAt(timestamp) {
  if (!timestamp) {
    return "";
  }
  const d = new Date(timestamp * 1000);
  return d.toLocaleString();
}

export function getTimeRemaining(timestamp) {
  if (!timestamp) {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  const expires = timestamp;
  const remaining = expires - now;

  if (remaining <= 0) {
    return { expired: true, minutes: 0, seconds: 0 };
  }

  return {
    expired: false,
    minutes: Math.floor(remaining / 60),
    seconds: remaining % 60,
    totalSeconds: remaining,
  };
}

export function isMobileDevice() {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(
    userAgent.toLowerCase()
  );
  const isMobileWidth = window.innerWidth <= 768;
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  return isMobileUA || (isMobileWidth && isTouchDevice);
}

