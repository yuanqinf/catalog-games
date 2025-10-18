'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/components/shared/search';
import ClerkAuth from '@/components/shared/clerk-auth';
import { useTranslation } from '@/lib/i18n/client';

const Header = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        // Show header on scroll up, hide on scroll down
        if (window.scrollY > lastScrollY && window.scrollY > 80) {
          // If scrolling down and past the header
          setIsVisible(false);
        } else {
          // If scrolling up
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);

      // Cleanup function
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [lastScrollY]);

  return (
    <nav
      className={`header sticky top-0 z-50 grid grid-cols-4 items-center gap-4 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <Link href="/" className="justify-self-start">
        <div className="header-logo">
          <Image src="/images/logo.png" alt={t('header_logo_alt')} width={56} height={56} />
        </div>
      </Link>
      <div
        // prettier-ignore
        className="col-span-2 justify-self-center w-full"
      >
        <SearchBar />
      </div>
      <div className="justify-self-end">
        <ClerkAuth />
      </div>
    </nav>
  );
};

export default Header;
