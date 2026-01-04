import { requireCustomer } from '@/lib/auth';
import { TrackingClient } from './TrackingClient';

export default async function TrackOrderPage({
  params,
}: {
  params: { orderId: string };
}) {
  await requireCustomer();
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
      <TrackingClient orderId={params.orderId} />
    </div>
  );
}
