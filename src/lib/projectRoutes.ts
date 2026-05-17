export const PROJECT_ROUTES = {
  en: '/projects',
  pl: '/pl/projekty',
} as const;

export function getProjectUrl(locale: 'en' | 'pl', slug: string) {
  return `${PROJECT_ROUTES[locale]}/${slug}`;
}
