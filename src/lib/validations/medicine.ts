import { z } from 'zod';

// =============================================================================
// Medicine Categories
// =============================================================================

export const MEDICINE_CATEGORIES = [
  'Pain Relief',
  'Cold & Flu',
  'Digestive Health',
  'Allergy',
  'First Aid',
  'Vitamins & Supplements',
  'Skin Care',
  'Eye Care',
  'Oral Care',
  'Other',
] as const;

export type MedicineCategory = typeof MEDICINE_CATEGORIES[number];

// =============================================================================
// Create Medicine Schema
// =============================================================================

export const createMedicineSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),

  price: z
    .number()
    .min(0.01, 'Price must be at least $0.01')
    .max(10000, 'Price cannot exceed $10,000'),

  compareAtPrice: z
    .number()
    .min(0, 'Compare at price cannot be negative')
    .optional()
    .nullable(),

  category: z.enum(MEDICINE_CATEGORIES, {
    message: 'Please select a valid category',
  }),

  stock: z
    .number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),

  lowStockThreshold: z
    .number()
    .int('Threshold must be a whole number')
    .min(0, 'Threshold cannot be negative')
    .default(10),

  manufacturer: z
    .string()
    .min(2, 'Manufacturer must be at least 2 characters')
    .max(100, 'Manufacturer cannot exceed 100 characters'),

  activeIngredients: z
    .array(z.string())
    .optional()
    .default([]),

  dosage: z
    .string()
    .max(500, 'Dosage cannot exceed 500 characters')
    .optional(),

  warnings: z
    .array(z.string())
    .optional()
    .default([]),

  directions: z
    .string()
    .max(1000, 'Directions cannot exceed 1000 characters')
    .optional(),

  image: z
    .string()
    // Allow valid URLs or relative paths
    .refine(
      (val) => !val || val.startsWith('http') || val.startsWith('/'),
      'Image must be a valid URL or path'
    )
    .optional()
    .nullable()
    .or(z.literal('')),

  isActive: z.boolean().default(true),

  isFeatured: z.boolean().default(false),

  tags: z
    .array(z.string())
    .optional()
    .default([]),
});

export type CreateMedicineInput = z.infer<typeof createMedicineSchema>;

// =============================================================================
// Update Medicine Schema
// =============================================================================

export const updateMedicineSchema = createMedicineSchema.partial();

export type UpdateMedicineInput = z.infer<typeof updateMedicineSchema>;

// =============================================================================
// Query Schema
// =============================================================================

export const medicineQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.enum(MEDICINE_CATEGORIES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'price', 'stock', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type MedicineQuery = z.infer<typeof medicineQuerySchema>;
