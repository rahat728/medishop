import { Plus, Search, Package } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function AdminMedicinesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicines</h1>
          <p className="text-gray-500 mt-1">Manage your medicine inventory</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>
          Add Medicine
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search medicines..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="">All Categories</option>
              <option value="pain-relief">Pain Relief</option>
              <option value="cold-flu">Cold & Flu</option>
              <option value="vitamins">Vitamins</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder */}
      <Card>
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Medicine Management</h3>
          <p className="text-gray-500 mb-4">
            Medicine CRUD operations will be implemented in Day 6.
          </p>
          <p className="text-sm text-blue-600">
            Run <code className="bg-blue-50 px-2 py-1 rounded">npm run db:seed</code> to populate sample data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
