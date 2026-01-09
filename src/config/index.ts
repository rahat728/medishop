// =============================================================================
// Application Configuration
// =============================================================================

export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'MedicineShop',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Medicine categories (OTC only)
  categories: [
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
  ] as const,

  // Order status flow
  orderStatusFlow: {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['assigned', 'cancelled'],
    assigned: ['picked_up', 'cancelled'],
    picked_up: ['on_the_way'],
    on_the_way: ['delivered'],
    delivered: [],
    cancelled: [],
  } as const,

  // Pagination defaults
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
} as const;

export type Category = typeof config.categories[number];
