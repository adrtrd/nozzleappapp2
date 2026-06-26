import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  nameEn?: string;
  icon: string; // Lucide icon name
  color: string;
  sortOrder: number;
  isActive: boolean;
  subcategories: Subcategory[];
}

export interface CustomField {
  label: string;
  type: 'text' | 'number' | 'dropdown' | 'date';
}

export interface LinkedFields {
  requiresBrand: boolean;
  requiresViscosity: boolean;
  requiresLiters: boolean;
  requiresNextOdometer: boolean;
  requiresNextDate: boolean;
  requiresFlushType: boolean; // partial/full
  requiresAxle: boolean; // differential axle
  requiresDOT: boolean; // DOT grade
  requiresTransmissionType: boolean;
  requiresFluidColor: boolean;
  customFields: CustomField[];
}

export interface PriceHistoryItem {
  price: number;
  changedAt: string;
  changedBy: string;
}

export interface Service {
  id: string;
  categoryId: string;
  subcategoryId: string;
  name: string;
  nameEn?: string;
  code: string;
  description: string;
  icon: string;
  status: 'active' | 'inactive' | 'seasonal';
  pricingModel: 'fixed' | 'unit' | 'range' | 'free' | 'custom';
  price: number;
  minPrice: number;
  maxPrice: number;
  unit: string;
  taxIncluded: boolean;
  linkedFields: LinkedFields;
  brandsForCategory: string[];
  viscosityOptions: string[];
  warrantyTemplateId?: string;
  nextIntervalKm?: number;
  nextIntervalDays?: number;
  invoiceDetailTemplate?: string;
  priceHistory: PriceHistoryItem[];

  // Legacy fields for backwards compatibility
  serviceType?: 'oil' | 'filter' | 'brake' | 'ac' | 'electrical' | 'tire' | 'general' | 'other';
  defaultPrice?: number;
  hasOilFields?: boolean;
  oilSubtype?: 'engine' | 'brake' | 'differential' | 'steering' | 'transmission' | 'coolant' | null;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  serviceIds: string[];
  pricingType: 'flat' | 'sum' | 'discount';
  flatPrice: number;
  discountPercent: number;
  isActive: boolean;
}

interface ServiceState {
  serviceCategories: ServiceCategory[];
  services: Service[];
  servicePackages: ServicePackage[];

  // Actions
  addCategory: (cat: Omit<ServiceCategory, 'id' | 'subcategories'> & { subcategories?: Omit<Subcategory, 'id' | 'categoryId'>[] }) => void;
  updateCategory: (id: string, updates: Partial<ServiceCategory>) => void;
  deleteCategory: (id: string) => void;
  
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, subcatId: string, updates: Partial<Subcategory>) => void;
  deleteSubcategory: (categoryId: string, subcatId: string) => void;

  addService: (service: Omit<Service, 'id' | 'priceHistory'> & { operatorId?: string }) => void;
  updateService: (id: string, updates: Partial<Service> & { operatorId?: string }) => void;
  deleteService: (id: string) => void;

  addPackage: (pack: Omit<ServicePackage, 'id'>) => void;
  updatePackage: (id: string, updates: Partial<ServicePackage>) => void;
  deletePackage: (id: string) => void;
  reorderCategories: (categories: ServiceCategory[]) => void;
}

const initialCategories: ServiceCategory[] = [
  {
    id: 'cat1',
    name: 'الزيوت',
    nameEn: 'Oils',
    icon: 'Droplet',
    color: 'amber',
    sortOrder: 1,
    isActive: true,
    subcategories: [
      { id: 'sub1_1', categoryId: 'cat1', name: 'زيت المحرك', sortOrder: 1, isActive: true },
      { id: 'sub1_2', categoryId: 'cat1', name: 'زيت الفرامل / البريك', sortOrder: 2, isActive: true },
      { id: 'sub1_3', categoryId: 'cat1', name: 'زيت الدفرنس', sortOrder: 3, isActive: true },
      { id: 'sub1_4', categoryId: 'cat1', name: 'زيت الستيرنج / التوجيه', sortOrder: 4, isActive: true },
      { id: 'sub1_5', categoryId: 'cat1', name: 'زيت ناقل الحركة / قير', sortOrder: 5, isActive: true },
      { id: 'sub1_6', categoryId: 'cat1', name: 'زيت التبريد / الكولنت', sortOrder: 6, isActive: true }
    ]
  },
  {
    id: 'cat2',
    name: 'الفلاتر',
    nameEn: 'Filters',
    icon: 'Layers',
    color: 'emerald',
    sortOrder: 2,
    isActive: true,
    subcategories: [
      { id: 'sub2_1', categoryId: 'cat2', name: 'فلتر الزيت', sortOrder: 1, isActive: true },
      { id: 'sub2_2', categoryId: 'cat2', name: 'فلتر الهواء', sortOrder: 2, isActive: true },
      { id: 'sub2_3', categoryId: 'cat2', name: 'فلتر الكابين', sortOrder: 3, isActive: true },
      { id: 'sub2_4', categoryId: 'cat2', name: 'فلتر الوقود', sortOrder: 4, isActive: true }
    ]
  },
  {
    id: 'cat3',
    name: 'الفرامل',
    nameEn: 'Brakes',
    icon: 'ShieldAlert',
    color: 'red',
    sortOrder: 3,
    isActive: true,
    subcategories: [
      { id: 'sub3_1', categoryId: 'cat3', name: 'تبديل تيل الفرامل', sortOrder: 1, isActive: true },
      { id: 'sub3_2', categoryId: 'cat3', name: 'تبديل قرص الفرامل', sortOrder: 2, isActive: true }
    ]
  },
  {
    id: 'cat4',
    name: 'التكييف',
    nameEn: 'AC',
    icon: 'Wind',
    color: 'sky',
    sortOrder: 4,
    isActive: true,
    subcategories: [
      { id: 'sub4_1', categoryId: 'cat4', name: 'شحن فريون', sortOrder: 1, isActive: true }
    ]
  },
  {
    id: 'cat5',
    name: 'الكهرباء',
    nameEn: 'Electrical',
    icon: 'Zap',
    color: 'purple',
    sortOrder: 5,
    isActive: true,
    subcategories: [
      { id: 'sub5_1', categoryId: 'cat5', name: 'البطاريات والكهرباء العامة', sortOrder: 1, isActive: true }
    ]
  },
  {
    id: 'cat6',
    name: 'الإطارات',
    nameEn: 'Tires',
    icon: 'Disc',
    color: 'blue',
    sortOrder: 6,
    isActive: true,
    subcategories: [
      { id: 'sub6_1', categoryId: 'cat6', name: 'ميزان الإطارات', sortOrder: 1, isActive: true }
    ]
  },
  {
    id: 'cat7',
    name: 'الفحص العام',
    nameEn: 'General Inspection',
    icon: 'Search',
    color: 'slate',
    sortOrder: 7,
    isActive: true,
    subcategories: [
      { id: 'sub7_1', categoryId: 'cat7', name: 'فحص شامل للسيارة', sortOrder: 1, isActive: true }
    ]
  },
  {
    id: 'cat8',
    name: 'أخرى',
    nameEn: 'Other',
    icon: 'PlusCircle',
    color: 'gray',
    sortOrder: 8,
    isActive: true,
    subcategories: [
      { id: 'sub8_1', categoryId: 'cat8', name: 'تصليح عطل ميكانيكي عام', sortOrder: 1, isActive: true }
    ]
  }
];

const initialServices: Service[] = [
  {
    id: 's1',
    categoryId: 'cat1',
    subcategoryId: 'sub1_1',
    name: 'زيت المحرك (Engine Oil)',
    nameEn: 'Engine Oil Service',
    code: 'SRV-001',
    description: 'تبديل زيت محرك السيارة مع اللزوجة واللترات',
    icon: 'Droplet',
    status: 'active',
    pricingModel: 'unit',
    price: 8000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'لتر',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: true,
      requiresViscosity: true,
      requiresLiters: true,
      requiresNextOdometer: true,
      requiresNextDate: true,
      requiresFlushType: true,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: ['Castrol', 'Mobil', 'Shell', 'Motul', 'Toyota'],
    viscosityOptions: ['0W-20', '5W-30', '5W-40', '10W-40', '15W-40', '20W-50'],
    warrantyTemplateId: 'w_oil',
    nextIntervalKm: 5000,
    nextIntervalDays: 90,
    invoiceDetailTemplate: '{brand} {productName}\nاللزوجة: {viscosity}\nالكمية: {qty} لتر',
    priceHistory: [{ price: 8000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's2',
    categoryId: 'cat1',
    subcategoryId: 'sub1_2',
    name: 'زيت الفرامل / البريك (Brake Fluid)',
    nameEn: 'Brake Fluid Service',
    code: 'SRV-002',
    description: 'تبديل أو تزويد زيت الفرامل الهيدروليكي',
    icon: 'Droplet',
    status: 'active',
    pricingModel: 'unit',
    price: 12000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'لتر',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: true,
      requiresViscosity: false,
      requiresLiters: true,
      requiresNextOdometer: true,
      requiresNextDate: true,
      requiresFlushType: false,
      requiresAxle: false,
      requiresDOT: true,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: ['Brembo', 'Bosch', 'Motul', 'ATE'],
    viscosityOptions: [],
    warrantyTemplateId: 'w_brake',
    nextIntervalKm: 20000,
    nextIntervalDays: 365,
    invoiceDetailTemplate: '{brand} DOT {dotGrade}\nالكمية: {qty} لتر',
    priceHistory: [{ price: 12000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's3',
    categoryId: 'cat1',
    subcategoryId: 'sub1_3',
    name: 'زيت الدفرنس (Differential Oil)',
    nameEn: 'Differential Oil Service',
    code: 'SRV-003',
    description: 'تغيير زيت الدفرنس للمحاور الأمامية أو الخلفية',
    icon: 'Droplet',
    status: 'active',
    pricingModel: 'unit',
    price: 15000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'لتر',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: true,
      requiresViscosity: true,
      requiresLiters: true,
      requiresNextOdometer: true,
      requiresNextDate: true,
      requiresFlushType: false,
      requiresAxle: true,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: ['Mobil', 'Valvoline', 'Liqui Moly'],
    viscosityOptions: ['75W-90', '75W-140', '80W-90'],
    nextIntervalKm: 40000,
    nextIntervalDays: 730,
    priceHistory: [{ price: 15000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's4',
    categoryId: 'cat1',
    subcategoryId: 'sub1_4',
    name: 'زيت الستيرنج / التوجيه (Power Steering)',
    nameEn: 'Power Steering Fluid',
    code: 'SRV-004',
    description: 'تغيير سائل علبة التوجيه الهيدروليكي',
    icon: 'Droplet',
    status: 'active',
    pricingModel: 'unit',
    price: 10000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'لتر',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: true,
      requiresViscosity: false,
      requiresLiters: true,
      requiresNextOdometer: true,
      requiresNextDate: true,
      requiresFlushType: false,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: ['Prestone', 'Castrol', 'Dexron'],
    viscosityOptions: [],
    priceHistory: [{ price: 10000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's5',
    categoryId: 'cat1',
    subcategoryId: 'sub1_5',
    name: 'زيت ناقل الحركة / قير (Transmission Oil)',
    nameEn: 'Transmission Oil Service',
    code: 'SRV-005',
    description: 'تغيير زيت ناقل الحركة العادي أو الأوتوماتيكي',
    icon: 'Droplet',
    status: 'active',
    pricingModel: 'unit',
    price: 18000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'لتر',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: true,
      requiresViscosity: false,
      requiresLiters: true,
      requiresNextOdometer: true,
      requiresNextDate: true,
      requiresFlushType: true,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: true,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: ['Aisin', 'Toyota ATF', 'Valvoline', 'Castrol Transmax'],
    viscosityOptions: [],
    nextIntervalKm: 50000,
    nextIntervalDays: 730,
    priceHistory: [{ price: 18000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's6',
    categoryId: 'cat1',
    subcategoryId: 'sub1_6',
    name: 'زيت التبريد / الكولنت (Coolant)',
    nameEn: 'Coolant Service',
    code: 'SRV-006',
    description: 'فحص وتغيير سائل تبريد المحرك (الراديتر)',
    icon: 'Droplet',
    status: 'active',
    pricingModel: 'unit',
    price: 6000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'لتر',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: true,
      requiresViscosity: false,
      requiresLiters: true,
      requiresNextOdometer: true,
      requiresNextDate: true,
      requiresFlushType: true,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: true,
      customFields: []
    },
    brandsForCategory: ['Prestone', 'Toyota Coolant', 'Peak'],
    viscosityOptions: [],
    priceHistory: [{ price: 6000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's7',
    categoryId: 'cat2',
    subcategoryId: 'sub2_1',
    name: 'فلتر الزيت',
    nameEn: 'Oil Filter',
    code: 'SRV-007',
    description: 'فلتر زيت المحرك الأصلي',
    icon: 'Layers',
    status: 'active',
    pricingModel: 'fixed',
    price: 15000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'قطعة',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: true,
      requiresViscosity: false,
      requiresLiters: false,
      requiresNextOdometer: false,
      requiresNextDate: false,
      requiresFlushType: false,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: ['Toyota', 'Hyundai', 'Fram', 'Mann-Filter'],
    viscosityOptions: [],
    priceHistory: [{ price: 15000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's8',
    categoryId: 'cat2',
    subcategoryId: 'sub2_2',
    name: 'فلتر الهواء',
    nameEn: 'Air Filter',
    code: 'SRV-008',
    description: 'فلتر هواء المحرك لتصفية الأتربة',
    icon: 'Layers',
    status: 'active',
    pricingModel: 'fixed',
    price: 10000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'قطعة',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: true,
      requiresViscosity: false,
      requiresLiters: false,
      requiresNextOdometer: false,
      requiresNextDate: false,
      requiresFlushType: false,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: ['Toyota', 'Hyundai', 'Mann-Filter'],
    viscosityOptions: [],
    priceHistory: [{ price: 10000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's9',
    categoryId: 'cat2',
    subcategoryId: 'sub2_3',
    name: 'فلتر الكابين (فلتر المكيف)',
    nameEn: 'Cabin Air Filter',
    code: 'SRV-009',
    description: 'فلتر تكييف الهواء للمقصورة الداخلية',
    icon: 'Layers',
    status: 'active',
    pricingModel: 'fixed',
    price: 12000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'قطعة',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: true,
      requiresViscosity: false,
      requiresLiters: false,
      requiresNextOdometer: false,
      requiresNextDate: false,
      requiresFlushType: false,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: ['Toyota', 'Hyundai', 'Mann-Filter'],
    viscosityOptions: [],
    priceHistory: [{ price: 12000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's10',
    categoryId: 'cat2',
    subcategoryId: 'sub2_4',
    name: 'فلتر الوقود',
    nameEn: 'Fuel Filter',
    code: 'SRV-010',
    description: 'مصفى البنزين أو الديزل لحماية المحرك',
    icon: 'Layers',
    status: 'active',
    pricingModel: 'fixed',
    price: 20000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'قطعة',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: true,
      requiresViscosity: false,
      requiresLiters: false,
      requiresNextOdometer: false,
      requiresNextDate: false,
      requiresFlushType: false,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: ['Toyota', 'Hyundai', 'Mann-Filter'],
    viscosityOptions: [],
    priceHistory: [{ price: 20000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's11',
    categoryId: 'cat3',
    subcategoryId: 'sub3_1',
    name: 'تبديل تيل الفرامل',
    nameEn: 'Brake Pads Replacement',
    code: 'SRV-011',
    description: 'تركيب فحمات فرامل جديدة وضبط الكبح',
    icon: 'ShieldAlert',
    status: 'active',
    pricingModel: 'fixed',
    price: 35000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'خدمة',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: false,
      requiresViscosity: false,
      requiresLiters: false,
      requiresNextOdometer: false,
      requiresNextDate: false,
      requiresFlushType: false,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: [],
    viscosityOptions: [],
    warrantyTemplateId: 'w_brake',
    priceHistory: [{ price: 35000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's12',
    categoryId: 'cat3',
    subcategoryId: 'sub3_2',
    name: 'تبديل قرص الفرامل',
    nameEn: 'Brake Rotor Replacement',
    code: 'SRV-012',
    description: 'خرط أو استبدال ديسكات البريكات للمحاور',
    icon: 'ShieldAlert',
    status: 'active',
    pricingModel: 'fixed',
    price: 40000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'خدمة',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: false,
      requiresViscosity: false,
      requiresLiters: false,
      requiresNextOdometer: false,
      requiresNextDate: false,
      requiresFlushType: false,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: [],
    viscosityOptions: [],
    priceHistory: [{ price: 40000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's13',
    categoryId: 'cat4',
    subcategoryId: 'sub4_1',
    name: 'شحن فريون',
    nameEn: 'AC Freon Recharge',
    code: 'SRV-013',
    description: 'تعبئة غاز فريون تبريد المكيف الأصلي',
    icon: 'Wind',
    status: 'active',
    pricingModel: 'fixed',
    price: 50000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'خدمة',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: false,
      requiresViscosity: false,
      requiresLiters: false,
      requiresNextOdometer: false,
      requiresNextDate: false,
      requiresFlushType: false,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: [],
    viscosityOptions: [],
    priceHistory: [{ price: 50000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's14',
    categoryId: 'cat6',
    subcategoryId: 'sub6_1',
    name: 'ميزان الإطارات (محاذاة)',
    nameEn: 'Tire Alignment',
    code: 'SRV-014',
    description: 'ضبط زوايا الإطارات لمنع الانحراف',
    icon: 'Disc',
    status: 'active',
    pricingModel: 'fixed',
    price: 25000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'خدمة',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: false,
      requiresViscosity: false,
      requiresLiters: false,
      requiresNextOdometer: false,
      requiresNextDate: false,
      requiresFlushType: false,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: [],
    viscosityOptions: [],
    priceHistory: [{ price: 25000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's15',
    categoryId: 'cat7',
    subcategoryId: 'sub7_1',
    name: 'فحص شامل للسيارة',
    nameEn: 'Full Vehicle Inspection',
    code: 'SRV-015',
    description: 'فحص كمبيوتر وأجزاء التعليق والمحرك الميكانيكي',
    icon: 'Search',
    status: 'active',
    pricingModel: 'fixed',
    price: 30000,
    minPrice: 0,
    maxPrice: 0,
    unit: 'خدمة',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: false,
      requiresViscosity: false,
      requiresLiters: false,
      requiresNextOdometer: false,
      requiresNextDate: false,
      requiresFlushType: false,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: [],
    viscosityOptions: [],
    priceHistory: [{ price: 30000, changedAt: '2026-03-01', changedBy: 'u1' }]
  },
  {
    id: 's16',
    categoryId: 'cat8',
    subcategoryId: 'sub8_1',
    name: 'تصليح عطل ميكانيكي عام',
    nameEn: 'General Mechanical Repair',
    code: 'SRV-016',
    description: 'خدمات الورشة العامة والميكانيك الحر',
    icon: 'PlusCircle',
    status: 'active',
    pricingModel: 'custom',
    price: 0,
    minPrice: 0,
    maxPrice: 0,
    unit: 'خدمة',
    taxIncluded: true,
    linkedFields: {
      requiresBrand: false,
      requiresViscosity: false,
      requiresLiters: false,
      requiresNextOdometer: false,
      requiresNextDate: false,
      requiresFlushType: false,
      requiresAxle: false,
      requiresDOT: false,
      requiresTransmissionType: false,
      requiresFluidColor: false,
      customFields: []
    },
    brandsForCategory: [],
    viscosityOptions: [],
    priceHistory: [{ price: 25000, changedAt: '2026-03-01', changedBy: 'u1' }]
  }
];

const initialServicesWithLegacy: Service[] = initialServices.map(s => {
  let serviceType: Service['serviceType'] = 'other';
  if (s.categoryId === 'cat1') serviceType = 'oil';
  else if (s.categoryId === 'cat2') serviceType = 'filter';
  else if (s.categoryId === 'cat3') serviceType = 'brake';
  else if (s.categoryId === 'cat4') serviceType = 'ac';
  else if (s.categoryId === 'cat5') serviceType = 'electrical';
  else if (s.categoryId === 'cat6') serviceType = 'tire';
  else if (s.categoryId === 'cat7') serviceType = 'general';

  let oilSubtype: Service['oilSubtype'] = null;
  if (s.subcategoryId === 'sub1_1') oilSubtype = 'engine';
  else if (s.subcategoryId === 'sub1_2') oilSubtype = 'brake';
  else if (s.subcategoryId === 'sub1_3') oilSubtype = 'differential';
  else if (s.subcategoryId === 'sub1_4') oilSubtype = 'steering';
  else if (s.subcategoryId === 'sub1_5') oilSubtype = 'transmission';
  else if (s.subcategoryId === 'sub1_6') oilSubtype = 'coolant';

  return {
    ...s,
    serviceType,
    defaultPrice: s.price,
    hasOilFields: s.categoryId === 'cat1',
    oilSubtype
  };
});

export const useServiceStore = create<ServiceState>()(
  persist(
    (set, get) => ({
      serviceCategories: initialCategories,
      services: initialServicesWithLegacy,
      servicePackages: [],

      addCategory: (catData) => {
        const newCat: ServiceCategory = {
          id: uuidv4(),
          name: catData.name,
          nameEn: catData.nameEn,
          icon: catData.icon,
          color: catData.color,
          sortOrder: catData.sortOrder || get().serviceCategories.length + 1,
          isActive: catData.isActive !== undefined ? catData.isActive : true,
          subcategories: (catData.subcategories || []).map((sub, idx) => ({
            id: uuidv4(),
            categoryId: '', // will be set below
            name: sub.name,
            sortOrder: sub.sortOrder || idx + 1,
            isActive: sub.isActive !== undefined ? sub.isActive : true
          }))
        };
        newCat.subcategories.forEach(sub => sub.categoryId = newCat.id);

        set((state) => ({ serviceCategories: [...state.serviceCategories, newCat] }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          serviceCategories: state.serviceCategories.map((c) => (c.id === id ? { ...c, ...updates } : c))
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          serviceCategories: state.serviceCategories.filter((c) => c.id !== id),
          services: state.services.filter((s) => s.categoryId !== id)
        }));
      },

      addSubcategory: (categoryId, name) => {
        set((state) => ({
          serviceCategories: state.serviceCategories.map((c) => {
            if (c.id !== categoryId) return c;
            const newSub: Subcategory = {
              id: uuidv4(),
              categoryId,
              name,
              sortOrder: c.subcategories.length + 1,
              isActive: true
            };
            return {
              ...c,
              subcategories: [...c.subcategories, newSub]
            };
          })
        }));
      },

      updateSubcategory: (categoryId, subcatId, updates) => {
        set((state) => ({
          serviceCategories: state.serviceCategories.map((c) => {
            if (c.id !== categoryId) return c;
            return {
              ...c,
              subcategories: c.subcategories.map(s => s.id === subcatId ? { ...s, ...updates } : s)
            };
          })
        }));
      },

      deleteSubcategory: (categoryId, subcatId) => {
        set((state) => ({
          serviceCategories: state.serviceCategories.map((c) => {
            if (c.id !== categoryId) return c;
            return {
              ...c,
              subcategories: c.subcategories.filter(s => s.id !== subcatId)
            };
          }),
          services: state.services.filter(s => s.subcategoryId !== subcatId)
        }));
      },

      addService: (serviceData) => {
        const { operatorId, ...data } = serviceData;
        const newService: Service = {
          ...data,
          id: uuidv4(),
          priceHistory: [{
            price: data.price,
            changedAt: new Date().toISOString(),
            changedBy: operatorId || 'system'
          }]
        };
        set((state) => ({ services: [...state.services, newService] }));
      },

      updateService: (id, updates) => {
        const { operatorId, ...rest } = updates;
        const oldService = get().services.find((s) => s.id === id);
        if (!oldService) return;

        let newHistory = [...oldService.priceHistory];
        if (rest.price !== undefined && rest.price !== oldService.price) {
          newHistory.push({
            price: rest.price,
            changedAt: new Date().toISOString(),
            changedBy: operatorId || 'system'
          });
        }

        set((state) => ({
          services: state.services.map((s) => (s.id === id ? { ...s, ...rest, priceHistory: newHistory } : s))
        }));
      },

      deleteService: (id) => {
        set((state) => ({
          services: state.services.filter((s) => s.id !== id)
        }));
      },

      addPackage: (packData) => {
        const newPack: ServicePackage = {
          ...packData,
          id: uuidv4()
        };
        set((state) => ({ servicePackages: [...state.servicePackages, newPack] }));
      },

      updatePackage: (id, updates) => {
        set((state) => ({
          servicePackages: state.servicePackages.map((p) => (p.id === id ? { ...p, ...updates } : p))
        }));
      },

      deletePackage: (id) => {
        set((state) => ({
          servicePackages: state.servicePackages.filter((p) => p.id !== id)
        }));
      },

      reorderCategories: (categories) => {
        const reordered = categories.map((c, idx) => ({ ...c, sortOrder: idx + 1 }));
        set({ serviceCategories: reordered });
      }
    }),
    {
      name: 'nozzle-service-store',
      version: 1
    }
  )
);
