import mr from './locales/mr.json';
import hi from './locales/hi.json';
import en from './locales/en.json';

const catalogs = { mr, hi, en };

export function translate(locale, key) {
  const table = catalogs[locale] || catalogs.mr;
  return table[key] ?? catalogs.mr[key] ?? key;
}

export { catalogs };
