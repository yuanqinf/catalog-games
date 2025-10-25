import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/sonner';

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Dissgame.click | Dislike the games you hate',
  description:
    'Dissgame.click is the ultimate anti-award for gamers. Click to DISS buggy releases, overhyped flops, and design disasters — and see which games get roasted the hardest.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${bricolage.variable} antialiased`}>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          localization={{
            userButton: {
              action__manageAccount: 'Profile',
              action__signOut: 'Logout',
            },
          }}
        >
          {children}
        </ClerkProvider>
        <Toaster />
      </body>
    </html>
  );
}
