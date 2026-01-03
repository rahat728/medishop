'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  X,
  Plus,
  Trash2,
  ImagePlus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { MEDICINE_CATEGORIES, type MedicineCategory } from '@/lib/validations/medicine';

// =============================================================================
// Types
// =============================================================================

interface MedicineFormData {
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  category: MedicineCategory | '';
  stock: number;
  lowStockThreshold: number;
  manufacturer: string;
  activeIngredients: string[];
  dosage: string;
  warnings: string[];
  directions: string;
  image: string;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
}

interface MedicineFormProps {
  initialData?: Partial<MedicineFormData> & { _id?: string };
  mode: 'create' | 'edit';
}

const defaultFormData: MedicineFormData = {
  name: '',
  description: '',
  price: 0,
  compareAtPrice: null,
  category: '',
  stock: 0,
  lowStockThreshold: 10,
  manufacturer: '',
  activeIngredients: [],
  dosage: '',
  warnings: [],
  directions: '',
  image: '',
  isActive: true,
  isFeatured: false,
  tags: [],
};

// =============================================================================
// Component
// =============================================================================

export function MedicineForm({ initialData, mode }: MedicineFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<MedicineFormData>({
    ...defaultFormData,
    ...initialData,
  });

  // Array field inputs
  const [newIngredient, setNewIngredient] = useState('');
  const [newWarning, setNewWarning] = useState('');
  const [newTag, setNewTag] = useState('');

  // =============================================================================
  // Handlers
  // =============================================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value as MedicineCategory }));
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: '' }));
    }
  };

  // Array field handlers
  const addArrayItem = (
    field: 'activeIngredients' | 'warnings' | 'tags',
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
      setter('');
    }
  };

  const removeArrayItem = (
    field: 'activeIngredients' | 'warnings' | 'tags',
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // =============================================================================
  // Validation
  // =============================================================================

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =============================================================================
  // Submit
  // =============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      const url = mode === 'create'
        ? '/api/medicines'
        : `/api/medicines/${initialData?._id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          compareAtPrice: formData.compareAtPrice || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save medicine');
      }

      toast.success(
        mode === 'create'
          ? 'Medicine created successfully!'
          : 'Medicine updated successfully!'
      );

      router.push('/medicines');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================================================
  // Render
  // =============================================================================

  const categoryOptions = MEDICINE_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Medicine Name *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="e.g., Ibuprofen 200mg"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
              >
                <option value="">Select category</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Describe the medicine, its uses, and benefits..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <Input
            label="Manufacturer *"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            error={errors.manufacturer}
            placeholder="e.g., PharmaCorp"
          />
        </CardContent>
      </Card>

      {/* Pricing & Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing & Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Price ($) *"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              error={errors.price}
            />

            <Input
              label="Compare at Price ($)"
              name="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.compareAtPrice || ''}
              onChange={handleChange}
              helperText="Original price for discounts"
            />

            <Input
              label="Stock Quantity *"
              name="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              error={errors.stock}
            />

            <Input
              label="Low Stock Alert"
              name="lowStockThreshold"
              type="number"
              min="0"
              value={formData.lowStockThreshold}
              onChange={handleChange}
              helperText="Alert when stock falls below"
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Active Ingredients
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addArrayItem('activeIngredients', newIngredient, setNewIngredient);
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Ibuprofen 200mg"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => addArrayItem('activeIngredients', newIngredient, setNewIngredient)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.activeIngredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {ingredient}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('activeIngredients', index)}
                    className="hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <Input
            label="Dosage"
            name="dosage"
            value={formData.dosage}
            onChange={handleChange}
            placeholder="e.g., Adults: 1-2 tablets every 4-6 hours"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Directions
            </label>
            <textarea
              name="directions"
              value={formData.directions}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="How to take this medicine..."
            />
          </div>

          {/* Warnings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warnings
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newWarning}
                onChange={(e) => setNewWarning(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addArrayItem('warnings', newWarning, setNewWarning);
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Do not exceed recommended dose"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => addArrayItem('warnings', newWarning, setNewWarning)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.warnings.map((warning, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                >
                  <AlertCircle className="w-3 h-3" />
                  {warning}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('warnings', index)}
                    className="hover:text-yellow-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image & Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Image & Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image URL
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {formData.image && (
                <div className="w-20 h-20 border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder-medicine.svg';
                    }}
                  />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Upload images to a service like Cloudinary and paste the URL here.
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addArrayItem('tags', newTag, setNewTag);
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., bestseller"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => addArrayItem('tags', newTag, setNewTag)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('tags', index)}
                    className="hover:text-gray-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleCheckboxChange}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Active (visible to customers)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleCheckboxChange}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Featured product</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {mode === 'create' ? 'Create Medicine' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
