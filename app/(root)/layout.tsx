import Header from '@/components/shared/header-footer/header';
import Footer from '@/components/shared/header-footer/footer';
import OnlineUsersBadge from '@/components/shared/online-users-badge';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main>
      <Header />
      {children}
      <Footer />
      <OnlineUsersBadge />
    </main>
  );
}
