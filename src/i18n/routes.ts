import type { Locale } from './messages';

type RouteKey = 'home' | 'projects' | 'studio' | 'contact';

const routes: Record<RouteKey, Record<Locale, string>> = {
  home: {
    en: '/',
    pl: '/pl',
  },
  projects: {
    en: '/projects',
    pl: '/pl/projekty',
  },
  studio: {
    en: '/studio',
    pl: '/pl/studio',
  },
  contact: {
    en: '/contact',
    pl: '/pl/kontakt',
  },
};

export function getRoute(locale: Locale, key: RouteKey) {
  return routes[key][locale];
}

export function getOtherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'pl' : 'en';
}
