import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InvoiceSettings {
  headerBgColor: string;
  headerTextColor: string;
  accentColor: string;
  logoUrl: string;
  logoPosition: 'left' | 'center' | 'right';
  logoSize: 'small' | 'medium' | 'large';
  showTagline: boolean;
  tagline: string;
  fontFamily: 'Tajawal' | 'Cairo' | 'Noto Sans Arabic' | 'IBM Plex Arabic';
  baseFontSize: '9pt' | '10pt' | '11pt';
  tableFontSize: number; // in pt (e.g. 8-16)
  invoicePrefix: string;
  startingNumber: number;
  zeroPadding: number;
  includeYear: boolean;
  resetNumbering: 'year' | 'never';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  showHijriDate: boolean;
  colorScheme: string;
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
    visitInfo: boolean;
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
  paperSize: 'A4' | 'A5' | 'Letter';
  printMargins: number; // in mm
  showSectionIcons: boolean;
  iconColor: string;
}

interface InvoiceSettingsState {
  invoiceSettings: InvoiceSettings;
  updateInvoiceSettings: (updates: Partial<InvoiceSettings>) => void;
}

const defaultInvoiceSettings: InvoiceSettings = {
  headerBgColor: '#0F172A',
  headerTextColor: '#FFFFFF',
  accentColor: '#6366F1',
  logoUrl: '',
  logoPosition: 'right',
  logoSize: 'medium',
  showTagline: true,
  tagline: 'نعتني بسيارتك بأعلى معايير الدقة والجودة',
  fontFamily: 'Tajawal',
  baseFontSize: '10pt',
  tableFontSize: 10,
  invoicePrefix: 'INV-',
  startingNumber: 1,
  zeroPadding: 4,
  includeYear: false,
  resetNumbering: 'never',
  dateFormat: 'DD/MM/YYYY',
  showHijriDate: false,
  colorScheme: 'Classic Dark',
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
    visitInfo: true
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
    notes: true
  },
  footerText: 'شكرًا لتعاملكم معنا. ثقتكم هي سر نجاحنا!',
  showQR: true,
  showStamp: true,
  showSignature: true,
  stampLabel: 'ختم المركز',
  signatureLabel: 'توقيع المدير الفني',
  paperSize: 'A4',
  printMargins: 10,
  showSectionIcons: true,
  iconColor: '#6366F1'
};

export const useInvoiceSettingsStore = create<InvoiceSettingsState>()(
  persist(
    (set) => ({
      invoiceSettings: defaultInvoiceSettings,
      updateInvoiceSettings: (updates) => {
        set((state) => ({
          invoiceSettings: { ...state.invoiceSettings, ...updates }
        }));
      }
    }),
    {
      name: 'nozzle-invoice-settings-store',
      version: 1
    }
  )
);
