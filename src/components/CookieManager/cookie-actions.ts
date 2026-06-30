// cookie-actions.ts
import type { CookiePreferences } from "./cookie-types";

const COOKIE_NAME = "cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Odczytuje wartość cookie.
 */
function getCookie(name: string): string | null {
  const cookies = document.cookie.split("; ");

  for (const cookie of cookies) {
    const [key, ...value] = cookie.split("=");

    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
}

/**
 * Tworzy lub nadpisuje cookie.
 */
function setCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    path?: string;
    domain?: string;
  } = {}
) {
  const { maxAge = COOKIE_MAX_AGE, path = "/", domain } = options;

  let cookie = `${name}=${encodeURIComponent(value)}`;

  cookie += `; path=${path}`;
  cookie += `; max-age=${maxAge}`;

  if (domain) {
    cookie += `; domain=${domain}`;
  }

  cookie += "; SameSite=Lax";

  // Wymagane bezpieczne ciasteczka na HTTPS
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    cookie += "; Secure";
  }

  document.cookie = cookie;
}

/**
 * Usuwa cookie.
 */
function deleteCookie(
  name: string,
  options: {
    path?: string;
    domain?: string;
  } = {}
) {
  const { path = "/", domain } = options;

  let cookie = `${name}=`;

  cookie += "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  cookie += `; path=${path}`;

  if (domain) {
    cookie += `; domain=${domain}`;
  }

  document.cookie = cookie;
}

/**
 * Zapisuje preferencje użytkownika.
 */
export function setCookieConsent(preferences: CookiePreferences): void {
  setCookie(COOKIE_NAME, JSON.stringify(preferences));
}

/**
 * Odczytuje zapisane preferencje.
 */
export function checkCookieConsent(): CookiePreferences | null {
  // Zabezpieczenie przed wywołaniem po stronie serwera (SSR)
  if (typeof document === "undefined") return null;

  const cookie = getCookie(COOKIE_NAME);

  if (!cookie) {
    return null;
  }

  try {
    return JSON.parse(cookie);
  } catch (error) {
    console.error("Invalid cookie consent:", error);
    deleteCookie(COOKIE_NAME);
    return null;
  }
}

/**
 * Włącza lub wyłącza analitykę.
 */
export function setAnalyticsCookie(isEnabled: boolean): void {
  if (isEnabled) {
    setCookie("google_analytics", "true");
    return;
  }

  deleteCookie("google_analytics");

  // Dynamiczne pobieranie domeny (z kropką na początku dla subdomen)
  const currentDomain = window.location.hostname === "localhost" 
    ? "localhost" 
    : `.${window.location.hostname.replace(/^www\./, "")}`;

  // Usuń wszystkie cookies Google Analytics (_ga*)
  document.cookie
    .split("; ")
    .map((cookie) => cookie.split("=")[0].trim())
    .filter((name) => name.startsWith("_ga"))
    .forEach((name) => {
      // Usuń ze ścieżki głównej
      deleteCookie(name);

      // Usuń dla całej domeny
      if (currentDomain !== "localhost") {
         deleteCookie(name, { domain: currentDomain });
      }
    });
}