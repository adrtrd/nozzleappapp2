import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ServiceCategory {
  id: string;
  name: string;
  nameEn?: string;
  icon: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  subcategoryId: string | null;
  name: string;
  code: string;
  description: string;
  pricingModel: 'fixed' | 'per_unit' | 'custom';
  defaultPrice: number;
  unit: string;
  isActive: boolean;
  requiresBrand: boolean;
  requiresViscosity: boolean;
  requiresLiters: boolean;
  requiresNextOdometer: boolean;
  requiresNextDate: boolean;
  requiresFlushType: boolean;
  requiresDOT: boolean;
  requiresAxle: boolean;
  viscosityOptions: string[];
  brands: string[];
  defaultIntervalKm: number;
  defaultIntervalDays: number;
  createdAt: string;

  // Compatibility fields
  price?: number;
  status?: 'active' | 'inactive';
  linkedFields?: {
    requiresBrand?: boolean;
    requiresViscosity?: boolean;
    requiresLiters?: boolean;
    requiresNextOdometer?: boolean;
    requiresNextDate?: boolean;
    requiresFlushType?: boolean;
    requiresDOT?: boolean;
    requiresAxle?: boolean;
    requiresTransmissionType?: boolean;
    requiresFluidColor?: boolean;
    customFields?: any[];
  };
  brandsForCategory?: string[];
  nextIntervalKm?: number;
  nextIntervalDays?: number;
  nameEn?: string;
  warrantyTemplateId?: string;
  oilSubtype?: 'engine' | 'brake' | 'differential' | 'steering' | 'transmission' | 'coolant' | null;
}

const DEFAULT_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-oil', name: 'الزيوت', icon: 'Fuel',
    color: '#F59E0B', sortOrder: 1, isActive: true,
    subcategories: [
      { id: 'sub-engine', categoryId: 'cat-oil',
        name: 'زيت المحرك', sortOrder: 1, isActive: true },
      { id: 'sub-brake', categoryId: 'cat-oil',
        name: 'زيت البريك', sortOrder: 2, isActive: true },
      { id: 'sub-diff', categoryId: 'cat-oil',
        name: 'زيت الدفرنس', sortOrder: 3, isActive: true },
      { id: 'sub-steering', categoryId: 'cat-oil',
        name: 'زيت الستيرنج', sortOrder: 4, isActive: true },
      { id: 'sub-gear', categoryId: 'cat-oil',
        name: 'زيت القير', sortOrder: 5, isActive: true },
      { id: 'sub-coolant', categoryId: 'cat-oil',
        name: 'سائل التبريد', sortOrder: 6, isActive: true },
    ],
  },
  {
    id: 'cat-filter', name: 'الفلاتر', icon: 'Filter',
    color: '#3B82F6', sortOrder: 2, isActive: true,
    subcategories: [
      { id: 'sub-oilfilter', categoryId: 'cat-filter',
        name: 'فلتر الزيت', sortOrder: 1, isActive: true },
      { id: 'sub-airfilter', categoryId: 'cat-filter',
        name: 'فلتر الهواء', sortOrder: 2, isActive: true },
      { id: 'sub-cabinfilter', categoryId: 'cat-filter',
        name: 'فلتر الكابين', sortOrder: 3, isActive: true },
    ],
  },
  {
    id: 'cat-brake', name: 'الفرامل', icon: 'CircleDot',
    color: '#EF4444', sortOrder: 3, isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-ac', name: 'التكييف', icon: 'Wind',
    color: '#06B6D4', sortOrder: 4, isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-electric', name: 'الكهرباء', icon: 'Zap',
    color: '#8B5CF6', sortOrder: 5, isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-tires', name: 'الإطارات', icon: 'Circle',
    color: '#6B7280', sortOrder: 6, isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-other', name: 'أخرى', icon: 'MoreHorizontal',
    color: '#64748B', sortOrder: 7, isActive: true,
    subcategories: [],
  },
];

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'srv-001', categoryId: 'cat-oil',
    subcategoryId: 'sub-engine',
    name: 'تغيير زيت المحرك', code: 'SRV-001',
    description: 'تغيير زيت المحرك مع الفلتر',
    pricingModel: 'per_unit', defaultPrice: 6000,
    unit: 'لتر', isActive: true,
    requiresBrand: true, requiresViscosity: true,
    requiresLiters: true, requiresNextOdometer: true,
    requiresNextDate: true, requiresFlushType: false,
    requiresDOT: false, requiresAxle: false,
    viscosityOptions: ['0W-20','5W-30','5W-40',
                       '10W-40','15W-40','20W-50'],
    brands: ['Castrol','Mobil 1','Shell','Total',
             'Liqui Moly','Valvoline','Motul'],
    defaultIntervalKm: 5000, defaultIntervalDays: 90,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv-002', categoryId: 'cat-filter',
    subcategoryId: 'sub-oilfilter',
    name: 'فلتر الزيت', code: 'SRV-002',
    description: 'تغيير فلتر الزيت',
    pricingModel: 'fixed', defaultPrice: 12000,
    unit: 'قطعة', isActive: true,
    requiresBrand: true, requiresViscosity: false,
    requiresLiters: false, requiresNextOdometer: false,
    requiresNextDate: false, requiresFlushType: false,
    requiresDOT: false, requiresAxle: false,
    viscosityOptions: [], brands: ['Bosch','Mann','Purflux'],
    defaultIntervalKm: 5000, defaultIntervalDays: 90,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv-003', categoryId: 'cat-oil',
    subcategoryId: 'sub-brake',
    name: 'زيت البريك', code: 'SRV-003',
    description: 'تغيير سائل الفرامل',
    pricingModel: 'per_unit', defaultPrice: 18000,
    unit: 'لتر', isActive: true,
    requiresBrand: true, requiresViscosity: false,
    requiresLiters: true, requiresNextOdometer: false,
    requiresNextDate: false, requiresFlushType: true,
    requiresDOT: true, requiresAxle: false,
    viscosityOptions: [], brands: ['Bosch','Total','Ate'],
    defaultIntervalKm: 40000, defaultIntervalDays: 730,
    createdAt: new Date().toISOString(),
  },
];

interface ServiceStore {
  categories: ServiceCategory[];
  services: ServiceItem[];
  addCategory: (cat: Omit<ServiceCategory,'id'>) => void;
  updateCategory: (id: string,
                   updates: Partial<ServiceCategory>) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string,
                   sub: Omit<Subcategory,'id'|'categoryId'>) => void;
  deleteSubcategory: (categoryId: string,
                      subcategoryId: string) => void;
  addService: (service: Omit<ServiceItem,'id'|'createdAt'>) => void;
  updateService: (id: string,
                  updates: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;
  getServicesByCategory: (categoryId: string) => ServiceItem[];
}

export const useServiceStore = create<ServiceStore>()(
  persist(
    (set, get) => ({
      categories: DEFAULT_CATEGORIES,
      services:   DEFAULT_SERVICES,

      addCategory: (cat) =>
        set((s) => ({
          categories: [
            ...s.categories,
            { ...cat, id: `cat-${crypto.randomUUID()}`,
              subcategories: cat.subcategories || [] },
          ],
        })),

      updateCategory: (id, updates) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          services: s.services.filter((srv) =>
            srv.categoryId !== id
          ),
        })),

      addSubcategory: (categoryId, sub) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  subcategories: [
                    ...(c.subcategories || []),
                    {
                      ...sub,
                      id: `sub-${crypto.randomUUID()}`,
                      categoryId,
                    },
                  ],
                }
              : c
          ),
        })),

      deleteSubcategory: (categoryId, subcategoryId) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  subcategories: (c.subcategories || [])
                    .filter((sub) => sub.id !== subcategoryId),
                }
              : c
          ),
        })),

      addService: (service) => {
        const newService: ServiceItem = {
          ...service,
          id: `srv-${crypto.randomUUID()}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          services: [...s.services, newService],
        }));
        return newService;
      },

      updateService: (id, updates) =>
        set((s) => ({
          services: s.services.map((srv) =>
            srv.id === id ? { ...srv, ...updates } : srv
          ),
        })),

      deleteService: (id) =>
        set((s) => ({
          services: s.services.filter((srv) => srv.id !== id),
        })),

      getServicesByCategory: (categoryId) =>
        get().services.filter(
          (srv) => srv.categoryId === categoryId && srv.isActive
        ),
    }),
    {
      name: 'service-store-v1',
      version: 1,
      migrate: (persisted: any, version: number) => {
        if (version === 0) {
          return {
            categories: DEFAULT_CATEGORIES,
            services: DEFAULT_SERVICES,
          };
        }
        return persisted;
      },
    }
  )
);
