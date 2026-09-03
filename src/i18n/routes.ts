import type { Locale } from "./messages";

type RouteKey = "home" | "projects" | "studio" | "contact" | "styleguide" | "brief" | "login";

const routes: Record<RouteKey, Record<Locale, string>> = {
  home: {
    en: "/",
    pl: "/pl",
  },
  projects: {
    en: "/projects",
    pl: "/pl/projekty",
  },
  studio: {
    en: "/studio",
    pl: "/pl/studio",
  },
  contact: {
    en: "/contact",
    pl: "/pl/kontakt",
  },
  styleguide: {
    en: "/style-guide",
    pl: "/pl/wytyczne-identyfikacji",
  },
  brief: {
    en: "/brief",
    pl: "/pl/brief",
  },
  login: {
    en: "/login",
    pl: "/pl/login",
  },
};

export function getRoute(locale: Locale, key: RouteKey) {
  return routes[key][locale];
}

export function getOtherLocale(locale: Locale): Locale {
  return locale === "en" ? "pl" : "en";
}
