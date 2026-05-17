import en from './messages/en.json';
import pl from './messages/pl.json';

export type Locale = 'en' | 'pl';

const dictionaries = {
  en,
  pl,
} as const;

type MessageKey = keyof typeof en;

export function getT(locale: Locale) {
  const dict = dictionaries[locale] ?? dictionaries.en;

  return function t(key: MessageKey, vars?: Record<string, string | number>) {
    let value = dict[key] ?? key;

    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replaceAll(`{${k}}`, String(v));
      }
    }

    return value;
  };
}
