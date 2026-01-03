import { Plus, Users } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

export default function AdminDeliveryMenPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Men</h1>
          <p className="text-gray-500 mt-1">Manage your delivery team</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>
          Add Delivery Man
        </Button>
      </div>

      {/* Placeholder */}
      <Card>
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery Team Management</h3>
          <p className="text-gray-500">
            Delivery men management will be implemented in Day 15.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
