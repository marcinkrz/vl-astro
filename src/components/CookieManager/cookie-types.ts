export interface CookieType {
  id: string;
  name: string;
  description: string;
  required?: boolean;
}

export interface CookiePreferences {
  [key: string]: boolean;
}

/**
 * Zwraca listę typów cookies.
 * Funkcja przyjmuje translator, dzięki czemu jest niezależna
 * od konkretnej biblioteki i18n.
 */
export const getCookieTypes = (
  t: (key: string) => string
): CookieType[] => [
  {
    id: "necessary",
    name: t("cookie.cookieTypes.necessary.title"),
    description: t("cookie.cookieTypes.necessary.description"),
    required: true,
  },
  {
    id: "analytics",
    name: t("cookie.cookieTypes.analytics.title"),
    description: t("cookie.cookieTypes.analytics.description"),
  },
];