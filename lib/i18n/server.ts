import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import { getOptions } from './settings';

const initI18next = async (lng: string, ns: string) => {
  const i18nInstance = createInstance();
  await i18nInstance.use(initReactI18next).init(getOptions(lng, ns));
  return i18nInstance;
};

export async function useTranslation(
  lng: string,
  ns: string = 'common',
  options: { keyPrefix?: string } = {},
) {
  const i18nextInstance = await initI18next(lng, ns);

  // Use dynamic import instead of fetch for better performance
  const resources = await import(`../../public/locales/${lng}/${ns}.json`);

  i18nextInstance.addResourceBundle(lng, ns, resources.default || resources);

  return {
    t: i18nextInstance.getFixedT(
      lng,
      Array.isArray(ns) ? ns[0] : ns,
      options.keyPrefix,
    ),
    i18n: i18nextInstance,
  };
}
