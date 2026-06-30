import en from './messages/en.json';
import pl from './messages/pl.json';

export type Locale = 'en' | 'pl';

const dictionaries = {
  en,
  pl,
} as const;

// Typ pomocniczy, który pozwoli TypeScriptowi podpowiadać zagnieżdżone klucze
type NestedKeyOf<T> = {
  [K in keyof T]: T[K] extends object ? `${K & string}` | `${K & string}.${NestedKeyOf<T[K]>}` : `${K & string}`;
}[keyof T];

export function getT(locale: Locale) {
  const dict = dictionaries[locale] ?? dictionaries.en;

  // Funkcja pomocnicza do wyciągania wartości z obiektu po ścieżce (np. "a.b.c")
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  return function t(key: NestedKeyOf<typeof en>, vars?: Record<string, string | number>): string {
    let value = getNestedValue(dict, key);

    // Jeśli klucz nie istnieje, zwróć sam klucz (fallback)
    if (value === undefined || typeof value !== 'string') {
      console.warn(`Translation missing for: ${key}`);
      return key;
    }

    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replaceAll(`{${k}}`, String(v));
      }
    }

    return value;
  };
}