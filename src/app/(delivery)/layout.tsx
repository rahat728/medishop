import { redirect } from 'next/navigation';
import { requireDelivery } from '@/lib/auth';
import { DeliveryNavbar } from '@/components/layout/DeliveryNavbar';

export default async function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const user = await requireDelivery();

  return (
    <div className="min-h-screen bg-gray-50">
      <DeliveryNavbar user={user} />
      <main className="pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
}
