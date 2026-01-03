'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Package,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Badge, Modal, ModalFooter } from '@/components/ui';
import { AdminHeader } from '@/components/layout';
import { DataTable, RowActions, type Column } from '@/components/admin';
import { MEDICINE_CATEGORIES } from '@/lib/validations/medicine';

// =============================================================================
// Types
// =============================================================================

interface Medicine {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  stock: number;
  lowStockThreshold: number;
  manufacturer: string;
  image?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// =============================================================================
// Component
// =============================================================================

export function MedicineList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id?: string; name?: string }>({
    open: false,
  });
  const [bulkAction, setBulkAction] = useState<string>('');

  // =============================================================================
  // Data Fetching
  // =============================================================================

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.set('search', search);
      if (category) params.set('category', category);

      const response = await fetch(`/api/medicines?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch medicines');
      }

      setMedicines(data.data.medicines);
      setPagination(data.data.pagination);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, category]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // =============================================================================
  // Actions
  // =============================================================================

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/medicines/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete medicine');
      }

      toast.success('Medicine deleted successfully');
      setDeleteModal({ open: false });
      fetchMedicines();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/medicines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update medicine');
      }

      toast.success(currentStatus ? 'Medicine deactivated' : 'Medicine activated');
      fetchMedicines();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/medicines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !currentStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update medicine');
      }

      toast.success(currentStatus ? 'Removed from featured' : 'Added to featured');
      fetchMedicines();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selected.length === 0) return;

    try {
      const response = await fetch('/api/medicines/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: bulkAction, ids: selected }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to perform action');
      }

      toast.success(data.message);
      setSelected([]);
      setBulkAction('');
      fetchMedicines();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // =============================================================================
  // Table Columns
  // =============================================================================

  const columns: Column<Medicine>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: (_, medicine) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {medicine.image ? (
              <img
                src={medicine.image}
                alt={medicine.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{medicine.name}</p>
            <p className="text-xs text-gray-500">{medicine.manufacturer}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (value) => (
        <Badge variant="default">{value}</Badge>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (value, medicine) => (
        <div>
          <span className="font-medium">${value.toFixed(2)}</span>
          {medicine.compareAtPrice && medicine.compareAtPrice > value && (
            <span className="ml-2 text-xs text-gray-400 line-through">
              ${medicine.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      render: (value, medicine) => {
        const isLow = value <= medicine.lowStockThreshold && value > 0;
        const isOut = value === 0;

        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-900'}`}>
              {value}
            </span>
            {isOut && (
              <Badge variant="error">Out of stock</Badge>
            )}
            {isLow && (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
          </div>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (value, medicine) => (
        <div className="flex items-center gap-2">
          <Badge variant={value ? 'success' : 'default'}>
            {value ? 'Active' : 'Inactive'}
          </Badge>
          {medicine.isFeatured && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
      ),
    },
  ];

  // =============================================================================
  // Row Actions
  // =============================================================================

  const getRowActions = (medicine: Medicine) => [
    {
      label: 'Edit',
      icon: Edit,
      onClick: () => router.push(`/medicines/${medicine._id}/edit`),
    },
    {
      label: medicine.isActive ? 'Deactivate' : 'Activate',
      icon: medicine.isActive ? EyeOff : Eye,
      onClick: () => handleToggleActive(medicine._id, medicine.isActive),
    },
    {
      label: medicine.isFeatured ? 'Unfeature' : 'Feature',
      icon: medicine.isFeatured ? StarOff : Star,
      onClick: () => handleToggleFeatured(medicine._id, medicine.isFeatured),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'danger' as const,
      onClick: () => setDeleteModal({ open: true, id: medicine._id, name: medicine.name }),
    },
  ];

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Medicines"
        subtitle={`${pagination.total} products in inventory`}
        actions={
          <Link href="/medicines/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>
              Add Medicine
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {MEDICINE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {selected.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Bulk Actions</option>
              <option value="delete">Delete Selected</option>
              <option value="activate">Activate Selected</option>
              <option value="feature">Feature Selected</option>
              <option value="unfeature">Unfeature Selected</option>
            </select>
            <Button
              size="sm"
              onClick={handleBulkAction}
              disabled={!bulkAction}
            >
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={medicines}
        loading={loading}
        emptyMessage="No medicines found"
        emptyIcon={Package}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search medicines...',
        }}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: (page) => setPagination((prev) => ({ ...prev, page })),
          onLimitChange: (limit) => setPagination((prev) => ({ ...prev, limit, page: 1 })),
        }}
        selection={{
          selected,
          onSelect: setSelected,
          idKey: '_id',
        }}
        rowActions={(medicine) => <RowActions actions={getRowActions(medicine)} />}
        onRowClick={(medicine) => router.push(`/medicines/${medicine._id}`)}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        title="Delete Medicine"
        size="sm"
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{deleteModal.name}</strong>?
          This action cannot be undone.
        </p>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setDeleteModal({ open: false })}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteModal.id && handleDelete(deleteModal.id)}
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
