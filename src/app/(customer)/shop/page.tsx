import { Search, Filter, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

const categories = [
  'All',
  'Pain Relief',
  'Cold & Flu',
  'Digestive Health',
  'Vitamins',
  'First Aid',
  'Skin Care',
];

export default function ShopPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shop OTC Medicines</h1>
        <p className="text-gray-500 mt-2">Browse our wide selection of over-the-counter medicines</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search medicines..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === 'All'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Placeholder */}
      <Card>
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Medicine Catalog</h3>
          <p className="text-gray-500 mb-4">
            Customer storefront will be implemented in Day 9.
          </p>
          <p className="text-sm text-blue-600">
            Run <code className="bg-blue-50 px-2 py-1 rounded">npm run db:seed</code> to populate sample products.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
