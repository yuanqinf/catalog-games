'use client';

import i18next from 'i18next';
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions } from './settings';

const runsOnServerSide = typeof window === 'undefined';

// Initialize i18next for client side
i18next
  .use(initReactI18next)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../../public/locales/${language}/${namespace}.json`)
    )
  )
  .init({
    ...getOptions('en', 'common'),
    lng: 'en',
    preload: runsOnServerSide ? ['en'] : [],
  });

export function useTranslation(ns: string = 'common', options?: { keyPrefix?: string }) {
  return useTranslationOrg(ns, options);
}
