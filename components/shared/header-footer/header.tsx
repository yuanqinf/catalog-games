'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/components/shared/search/search-bar';
import ClerkAuth from '@/components/shared/clerk-auth';
import { useTranslation } from '@/lib/i18n/client';
import { SearchProvider, useSearchContext } from '@/contexts/search-context';

function HeaderContent() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { isMobileSearchActive } = useSearchContext();

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
      className={`header sticky top-0 z-50 grid items-center gap-4 transition-all duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${isMobileSearchActive ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-4'}`}
    >
      <Link
        href="/"
        className={`justify-self-start transition-opacity duration-300 ${
          isMobileSearchActive ? 'hidden md:block' : 'block'
        }`}
      >
        <div className="header-logo">
          <Image
            src="/images/logo.png"
            alt={t('header_logo_alt')}
            width={56}
            height={56}
          />
        </div>
      </Link>
      <div
        className={`w-full justify-self-center transition-all duration-300 ${
          isMobileSearchActive ? 'col-span-1' : 'col-span-2'
        } md:col-span-2`}
      >
        <SearchBar />
      </div>
      <div
        className={`justify-self-end transition-opacity duration-300 ${
          isMobileSearchActive ? 'opacity-0 md:opacity-100' : 'opacity-100'
        }`}
      >
        <ClerkAuth />
      </div>
    </nav>
  );
}

const Header = () => {
  return (
    <SearchProvider>
      <HeaderContent />
    </SearchProvider>
  );
};

export default Header;
