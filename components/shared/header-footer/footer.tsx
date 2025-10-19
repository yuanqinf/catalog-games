'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/client';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full py-8">
      <div className="container mx-auto px-4">
        {/* Divider */}
        <div className="my-6 h-px w-full bg-zinc-700" />
        {/* Copyright and Legal */}
        <div className="flex flex-col items-center justify-between text-sm text-gray-400 md:flex-row">
          <p>{t('footer_copyright')}</p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <Link
              href="/about/faq"
              className="transition-colors hover:text-gray-300"
            >
              {t('footer_faq')}
            </Link>
            <Link
              href="/about/privacy"
              className="transition-colors hover:text-gray-300"
            >
              {t('footer_privacy_policy')}
            </Link>
            <Link
              href="/about/terms"
              className="transition-colors hover:text-gray-300"
            >
              {t('footer_terms_of_use')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
