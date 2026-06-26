import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WorkingDaySettings {
  open: boolean;
  from: string;
  to: string;
}

export interface WorkingHoursSettings {
  sunday: WorkingDaySettings;
  monday: WorkingDaySettings;
  tuesday: WorkingDaySettings;
  wednesday: WorkingDaySettings;
  thursday: WorkingDaySettings;
  friday: WorkingDaySettings;
  saturday: WorkingDaySettings;
}

export interface InvoiceSettingsData {
  headerBgColor: string;
  headerTextColor: string;
  accentColor: string;
  gradientColor1: string;
  gradientColor2: string;
  showGradientStripe: boolean;
  stripeHeight: number;
  logoBase64: string | null;
  logoPosition: 'left' | 'center' | 'right';
  logoSize: 'small' | 'medium' | 'large';
  centerName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  commercialReg: string;
  taxNumber: string;
  fontFamily: string;
  baseFontSize: number;
  invoicePrefix: string;
  startingNumber: number;
  zeroPadding: number;
  includeYear: boolean;
  dateFormat: string;
  showHijriDate: boolean;
  paperSize: 'A4' | 'A5' | 'Letter';
  colorScheme: string;
  showSectionIcons: boolean;
  sections: {
    customer: boolean;
    vehicle: boolean;
    services: boolean;
    totals: boolean;
    payment: boolean;
    notes: boolean;
    warranty: boolean;
    terms: boolean;
    signature: boolean;
  };
  tableColumns: {
    num: boolean;
    badge: boolean;
    name: boolean;
    details: boolean;
    qty: boolean;
    unit: boolean;
    unitPrice: boolean;
    total: boolean;
    notes: boolean;
  };
  footerText: string;
  showQR: boolean;
  showStamp: boolean;
  showSignature: boolean;
  stampLabel: string;
  signatureLabel: string;
  printMargins: number;
  autoPrint: boolean;
  printCopies: number;
}

export interface WarrantyTemplate {
  id: string;
  name: string;
  type: 'general' | 'category';
  categoryId?: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
  variables: string[];
}

export interface SettingsState {
  invoice: InvoiceSettingsData;
  warrantyTemplates: WarrantyTemplate[];
  serviceCategories: any[];
  serviceCatalog: any[];
  workingHours: WorkingHoursSettings;
  holidays: string[];
  currency: string;
  taxRate: number;
  paymentMethods: {
    cash: boolean;
    card: boolean;
    transfer: boolean;
    electronic: boolean;
    deferred: boolean;
  };
  maxDeferredDays: number;
  lastInvoiceNumber: number;

  updateInvoice: (updates: Partial<InvoiceSettingsData>) => void;
  updateInvoiceSection: (key: string, value: boolean) => void;
  updateTableColumn: (key: string, value: boolean) => void;
  setLogo: (base64: string | null) => void;
  removeLogo: () => void;
  addWarrantyTemplate: (template: Omit<WarrantyTemplate, 'id'>) => void;
  updateWarrantyTemplate: (id: string, updates: Partial<WarrantyTemplate>) => void;
  deleteWarrantyTemplate: (id: string) => void;
  updateSettings: (updates: any) => void;
  generateInvoiceNumber: () => string;
  resetInvoiceCounter: () => void;
}

export const DAY_MAP = [
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الاثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
  { key: 'friday', label: 'الجمعة' },
  { key: 'saturday', label: 'السبت' },
];

export const convertWorkingHoursObjToArray = (whObj: any) => {
  return DAY_MAP.map(({ key, label }) => {
    const dayData = whObj?.[key] || { open: false, from: '08:00', to: '17:00' };
    
    const formatTime = (timeStr: string) => {
      if (!timeStr) return '';
      const [hStr, mStr] = timeStr.split(':');
      let h = parseInt(hStr, 10);
      const m = mStr || '00';
      const ampm = h >= 12 ? 'م' : 'ص';
      h = h % 12;
      if (h === 0) h = 12;
      const hFormatted = String(h).padStart(2, '0');
      return `${hFormatted}:${m} ${ampm}`;
    };

    const hoursStr = dayData.open 
      ? `${formatTime(dayData.from)} - ${formatTime(dayData.to)}`
      : 'مغلق';

    return {
      day: label,
      isOpen: dayData.open,
      hours: hoursStr
    };
  });
};

export const convertWorkingHoursArrayToObj = (whArray: any[]) => {
  const whObj: any = {};
  
  const parseTime = (timeStr: string, defaultTime: string) => {
    if (!timeStr) return defaultTime;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(ص|م)$/);
    if (!match) return defaultTime;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = match[3];
    if (ampm === 'م' && h < 12) h += 12;
    if (ampm === 'ص' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  };

  (whArray || []).forEach((item: any) => {
    const dayMapEntry = DAY_MAP.find(d => d.label === item.day);
    if (dayMapEntry) {
      const parts = item.hours.split(' - ');
      const from24 = parseTime(parts[0], '08:00');
      const to24 = parseTime(parts[1], '17:00');
      whObj[dayMapEntry.key] = {
        open: item.isOpen,
        from: from24,
        to: to24
      };
    }
  });

  return whObj;
};

const defaultInvoiceSettings: InvoiceSettingsData = {
  headerBgColor: '#0F172A',
  headerTextColor: '#FFFFFF',
  accentColor: '#6366F1',
  gradientColor1: '#6366F1',
  gradientColor2: '#06B6D4',
  showGradientStripe: true,
  stripeHeight: 3,
  logoBase64: null,
  logoPosition: 'right',
  logoSize: 'medium',
  centerName: 'مركز خدمة السيارات',
  tagline: 'نعتني بسيارتك بأعلى معايير الدقة والجودة',
  phone: '07701234567',
  email: 'info@nozzle.iq',
  address: 'بغداد، الكرادة، شارع العرصات',
  website: 'www.nozzle.iq',
  commercialReg: '109283-IQ',
  taxNumber: '900-283-119',
  fontFamily: 'Tajawal',
  baseFontSize: 10,
  invoicePrefix: 'INV-',
  startingNumber: 1,
  zeroPadding: 4,
  includeYear: false,
  dateFormat: 'DD/MM/YYYY',
  showHijriDate: false,
  paperSize: 'A4',
  colorScheme: 'dark',
  showSectionIcons: true,
  sections: {
    customer: true,
    vehicle: true,
    services: true,
    totals: true,
    payment: true,
    notes: true,
    warranty: true,
    terms: true,
    signature: true,
  },
  tableColumns: {
    num: true,
    badge: true,
    name: true,
    details: true,
    qty: true,
    unit: true,
    unitPrice: true,
    total: true,
    notes: false,
  },
  footerText: 'شكراً لثقتكم بمركزنا — نتمنى لكم قيادة آمنة',
  showQR: false,
  showStamp: true,
  showSignature: true,
  stampLabel: 'ختم المركز',
  signatureLabel: 'توقيع المسؤول',
  printMargins: 12,
  autoPrint: false,
  printCopies: 1,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set: any, get: any) => ({
      invoice: defaultInvoiceSettings,
      warrantyTemplates: [],
      serviceCategories: [],
      serviceCatalog: [],
      workingHours: {
        sunday:    { open: true,  from: '08:00', to: '17:00' },
        monday:    { open: true,  from: '08:00', to: '17:00' },
        tuesday:   { open: true,  from: '08:00', to: '17:00' },
        wednesday: { open: true,  from: '08:00', to: '17:00' },
        thursday:  { open: true,  from: '08:00', to: '17:00' },
        friday:    { open: false, from: '08:00', to: '17:00' },
        saturday:  { open: false, from: '08:00', to: '17:00' },
      },
      holidays: [],
      currency: 'IQD',
      taxRate: 0,
      paymentMethods: {
        cash: true,
        card: true,
        transfer: true,
        electronic: true,
        deferred: true,
      },
      maxDeferredDays: 30,
      lastInvoiceNumber: 0,

      generateInvoiceNumber: () => {
        const state  = get();
        const next   = (state.lastInvoiceNumber || 0) + 1;
        const prefix = state.invoice?.invoicePrefix || 'INV-';
        const pad    = state.invoice?.zeroPadding   || 4;
        const padded = String(next).padStart(pad, '0');
        const number = `${prefix}${padded}`;
        // Save the counter
        set({ lastInvoiceNumber: next });
        return number;
      },

      resetInvoiceCounter: () => set({ lastInvoiceNumber: 0 }),

      updateInvoice: (updates) =>
        set((state: any) => {
          const mergedSections = updates.sections
            ? { ...state.invoice?.sections, ...updates.sections }
            : state.invoice?.sections;

          const mergedTableColumns = updates.tableColumns
            ? { ...state.invoice?.tableColumns, ...updates.tableColumns }
            : state.invoice?.tableColumns;

          return {
            invoice: {
              ...state.invoice,
              ...updates,
              sections: mergedSections,
              tableColumns: mergedTableColumns,
            }
          };
        }),

      updateInvoiceSection: (key, value) =>
        set((state: any) => ({
          invoice: {
            ...state.invoice,
            sections: { ...state.invoice.sections, [key]: value }
          }
        })),

      updateTableColumn: (key, value) =>
        set((state: any) => ({
          invoice: {
            ...state.invoice,
            tableColumns: { ...state.invoice.tableColumns, [key]: value }
          }
        })),

      setLogo: (base64) =>
        set((state: any) => ({
          invoice: { ...state.invoice, logoBase64: base64 }
        })),

      removeLogo: () =>
        set((state: any) => ({
          invoice: { ...state.invoice, logoBase64: null }
        })),

      addWarrantyTemplate: (template) =>
        set((state: any) => ({
          warrantyTemplates: [
            ...state.warrantyTemplates,
            {
              ...template,
              id: crypto.randomUUID()
            }
          ]
        })),

      updateWarrantyTemplate: (id, updates) =>
        set((state: any) => ({
          warrantyTemplates: state.warrantyTemplates.map((t: any) =>
            t.id === id ? { ...t, ...updates } : t
          )
        })),

      deleteWarrantyTemplate: (id) =>
        set((state: any) => ({
          warrantyTemplates: state.warrantyTemplates.filter((t: any) => t.id !== id)
        })),

      updateSettings: (updates: any) =>
        set((state: any) => {
          const invoiceUpdates: any = {};
          const rootUpdates: any = {};
          
          Object.keys(updates).forEach((key) => {
            if (key === 'workingHours') {
              rootUpdates.workingHours = Array.isArray(updates.workingHours)
                ? convertWorkingHoursArrayToObj(updates.workingHours)
                : updates.workingHours;
            } else if (key in defaultInvoiceSettings) {
              invoiceUpdates[key] = updates[key];
            } else {
              rootUpdates[key] = updates[key];
            }
          });

          const newInvoice = Object.keys(invoiceUpdates).length > 0 
            ? { ...state.invoice, ...invoiceUpdates }
            : state.invoice;

          return {
            ...rootUpdates,
            invoice: newInvoice,
          };
        }),
    }),
    {
      name: 'settings-storage',
      merge: (persisted: any, current: any) => ({
        ...current,
        ...persisted,
        invoice: {
          ...defaultInvoiceSettings,
          ...(persisted?.invoice || {}),
          sections: {
            ...defaultInvoiceSettings.sections,
            ...(persisted?.invoice?.sections || {}),
          },
          tableColumns: {
            ...defaultInvoiceSettings.tableColumns,
            ...(persisted?.invoice?.tableColumns || {}),
          },
        },
      }),
    }
  )
);
