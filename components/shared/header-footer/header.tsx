'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/components/shared/search';
import ClerkAuth from '@/components/shared/clerk-auth';

const Header = () => {
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
      className={`header sticky top-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
    >
      <Link href="/">
        <div className="header-logo">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={56}
            height={56}
            className="block md:hidden"
          />
          <Image
            src="/images/logo_with_title.png"
            alt="Catalog.Games Logo"
            width={64}
            height={64}
            className="hidden md:block"
          />
        </div>
      </Link>
      <div className="flex w-1/2 items-center justify-center gap-8">
        <SearchBar />
      </div>
      <div className="flex items-center justify-end gap-4">
        <ClerkAuth />
      </div>
    </nav>
  );
};

export default Header;
