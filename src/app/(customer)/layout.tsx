import { Navbar, Footer } from '@/components/layout';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('🏠 [CustomerLayout] Rendering');
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

