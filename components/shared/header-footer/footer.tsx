import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="w-full py-8">
      <div className="container mx-auto px-4">
        {/* Divider */}
        <div className="my-6 h-px w-full bg-zinc-700" />
        {/* Copyright and Legal */}
        <div className="flex flex-col items-center justify-between text-sm text-zinc-400 md:flex-row">
          <p>© 2025 Dissgame.click All rights reserved.</p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <Link
              href="/privacy"
              className="transition-colors hover:text-zinc-300"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-zinc-300"
            >
              Terms of Use
            </Link>
            <Link
              href="/cookies"
              className="transition-colors hover:text-zinc-300"
            >
              Cookie Preferences
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
