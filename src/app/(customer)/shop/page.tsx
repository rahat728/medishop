'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui';
import {
  ProductGrid,
  CategoryFilter,
  SearchBar,
  SortDropdown,
  PriceFilter,
  Pagination,
} from '@/components/customer';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  image?: string;
  manufacturer: string;
  inStock: boolean;
  isFeatured?: boolean;
  discountPercentage?: number;
}

interface Category {
  name: string;
  slug: string;
  count: number;
  inStock: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters from URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'name';
  const page = parseInt(searchParams.get('page') || '1');
  const minPrice = parseFloat(searchParams.get('minPrice') || '0');
  const maxPrice = parseFloat(searchParams.get('maxPrice') || '1000');

  // =============================================================================
  // Data Fetching
  // =============================================================================

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy: sortBy.replace('-desc', ''),
        sortOrder: sortBy.includes('-desc') ? 'desc' : 'asc',
      });

      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (minPrice > 0) params.set('minPrice', minPrice.toString());
      if (maxPrice < 1000) params.set('maxPrice', maxPrice.toString());

      const response = await fetch(`/api/shop/medicines?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(data.data.medicines);
      setPagination(data.data.pagination);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sortBy, minPrice, maxPrice]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/shop/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // =============================================================================
  // Filter Handlers
  // =============================================================================

  const updateFilters = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change (except for page changes)
    if (!('page' in newParams)) {
      params.set('page', '1');
    }

    router.push(`/shop?${params.toString()}`);
  };

  const handleSearch = (query: string) => {
    updateFilters({ search: query || undefined });
  };

  const handleCategoryChange = (cat: string) => {
    updateFilters({ category: cat || undefined });
  };

  const handleSortChange = (sort: string) => {
    updateFilters({ sortBy: sort });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() });
  };

  const handlePriceChange = (min: number, max: number) => {
    updateFilters({
      minPrice: min > 0 ? min.toString() : undefined,
      maxPrice: max < 1000 ? max.toString() : undefined,
    });
  };

  const handleAddToCart = (productId: string) => {
    // Will be implemented in Day 10
    toast.success('Added to cart!');
  };

  const clearFilters = () => {
    router.push('/shop');
  };

  const hasActiveFilters = search || category || minPrice > 0 || maxPrice < 1000;

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shop OTC Medicines</h1>
        <p className="text-gray-500 mt-2">
          Browse our wide selection of over-the-counter medicines
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar
          initialValue={search}
          onSearch={handleSearch}
          placeholder="Search medicines, brands, conditions..."
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <CategoryFilter
                categories={categories}
                selectedCategory={category}
                onCategoryChange={handleCategoryChange}
                loading={categoriesLoading}
              />
            </div>

            {/* Price Filter */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <PriceFilter
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceChange={handlePriceChange}
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="secondary"
                onClick={clearFilters}
                className="w-full"
                leftIcon={<X className="w-4 h-4" />}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Mobile Filter Button */}
              <Button
                variant="secondary"
                className="lg:hidden"
                onClick={() => setShowMobileFilters(true)}
                leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              >
                Filters
              </Button>

              {/* Results Count */}
              <p className="text-sm text-gray-600">
                {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
              </p>
            </div>

            <SortDropdown value={sortBy} onChange={handleSortChange} />
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm text-gray-500">Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  Search: {search}
                  <button onClick={() => handleSearch('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {category && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  {category}
                  <button onClick={() => handleCategoryChange('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(minPrice > 0 || maxPrice < 1000) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  ${minPrice} - ${maxPrice}
                  <button onClick={() => handlePriceChange(0, 1000)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Products Grid */}
          <ProductGrid
            products={products}
            loading={loading}
            onAddToCart={handleAddToCart}
            emptyMessage={search ? `No results for "${search}"` : 'No products found'}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-12">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto h-full pb-24">
              {/* Categories */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                <CategoryFilter
                  categories={categories}
                  selectedCategory={category}
                  onCategoryChange={(cat) => {
                    handleCategoryChange(cat);
                    setShowMobileFilters(false);
                  }}
                  loading={categoriesLoading}
                />
              </div>

              {/* Price Filter */}
              <PriceFilter
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceChange={(min, max) => {
                  handlePriceChange(min, max);
                  setShowMobileFilters(false);
                }}
              />

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    clearFilters();
                    setShowMobileFilters(false);
                  }}
                  className="w-full"
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}
