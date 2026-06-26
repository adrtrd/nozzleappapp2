import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VisitStatus = 'منتظر' | 'استقبلت' | 'قيد الفحص' | 'قيد التنفيذ' | 'انتهت' | 'سُلّمت' | 'Open' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Visit {
  id: string;
  customerId: string;
  carId: string;
  technicianId: string;
  entryDate: string;
  entryOdometer: number;
  notes: string;
  status: VisitStatus;
  createdAt: string;

  // Overhaul additions
  priority?: 'normal' | 'urgent' | 'vip';
  exitDate?: string;
  exitOdometer?: number;
  customerComplaint?: string;
  receptionNotes?: string;
  technicianNotes?: string;
  closingNotes?: string;
  receptionPhotos?: { url: string; uploadedAt: string }[];
  internalRating?: number;
  createdBy?: string;
  statusLog?: { status: VisitStatus; changedAt: string; changedBy: string }[];
}

export interface OilServiceDetails {
  brand?: string;
  productName?: string;
  viscosity?: string;
  litersUsed?: number;
  pricePerLiter?: number;
  oilType?: string; // Fully Synthetic / Semi-Synthetic / Mineral
  dotGrade?: string; // DOT 3 / DOT 4 / etc.
  axle?: string; // Front / Rear / Both / Limited Slip
  transmissionType?: string; // Automatic / Manual / CVT / DSG
  flushType?: string; // Drain & Fill / Full Flush / Partial / Full
  currentOdometer?: number;
  nextChangeOdometer?: number;
  nextChangeIntervalKm?: number;
  nextChangeDate?: string;
  color?: string; // Coolant color
  concentration?: string; // Coolant concentration %
  notes?: string;
  refrigerantType?: string; // R134a / R1234yf / R22
  pressureBefore?: string;
  pressureAfter?: string;
}

export interface VisitService {
  id: string;
  visitId: string;
  serviceId: string;
  serviceName: string;
  categoryName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes: string;
  oilDetails: OilServiceDetails | null;
  customFieldsData?: Record<string, string>; // to store dynamic fields
  
  // Overhaul additions
  categoryId?: string;
  subcategoryName?: string;
  sortOrder?: number;
  customFieldValues?: Record<string, any>;
}

export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'draft' | 'issued' | 'paid' | 'partial' | 'void';

export interface Invoice {
  id: string;
  visitId: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  discountType: 'flat' | 'percent';
  tax: number;
  total: number;
  status: InvoiceStatus;
  issuedAt: string;

  // Overhaul additions
  discountValue?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalInWords?: string;
  paymentStatus?: 'paid' | 'partial' | 'unpaid' | 'deferred';
  totalPaid?: number;
  totalRemaining?: number;
  issuedBy?: string;
  warrantyContent?: string;
  notes?: string;
  maintenanceReminders?: any[];
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'deferred' | 'partial' | 'electronic';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface Payment {
  id: string;
  invoiceId: string;
  visitId: string;
  customerId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  paidDate?: string;
  notes?: string;

  // Overhaul additions
  methodDetails?: {
    receiptNumber?: string;
    bankName?: string;
    platform?: string;
  };
  isDeferred?: boolean;
  deferredDueDate?: string;
  deferredGuarantor?: string;
  paidAt?: string;
  recordedBy?: string;
}

export interface VisitStatusLog {
  id: string;
  visitId: string;
  status: VisitStatus;
  changedAt: string;
  changedBy: string;
  note: string;
}

export interface PaymentLog {
  id: string;
  paymentId: string;
  date: string;
  amount: number;
  method: string;
  recordedBy: string;
  note?: string;
}

interface VisitState {
  visits: Visit[];
  visitServices: VisitService[];
  invoices: Invoice[];
  payments: Payment[];
  visitStatusLogs: VisitStatusLog[];
  paymentsLog: PaymentLog[];

  // Actions
  addVisit: (visit: Omit<Visit, 'id' | 'status' | 'createdAt'> & { operatorId?: string }) => string;
  updateVisit: (id: string, updates: Partial<Visit> & { operatorId?: string; statusNote?: string }) => void;
  deleteVisit: (id: string) => void;

  addVisitService: (vs: Omit<VisitService, 'id'>) => void;
  removeVisitService: (id: string) => void;
  updateVisitService: (id: string, updates: Partial<VisitService>) => void;

  generateInvoice: (visitId: string, invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'issuedAt' | 'visitId'> & { prefix?: string; padding?: number; includeYear?: boolean }) => string;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  deleteInvoice: (id: string) => void;

  addPayment: (payment: Omit<Payment, 'id'> & { operatorId?: string }) => string;
  updatePayment: (id: string, updates: Partial<Payment> & { operatorId?: string; paymentAmount?: number }) => void;
  deletePayment: (id: string) => void;
  markPaymentAsPaid: (id: string, operatorId?: string) => void;
}

const initialVisits: Visit[] = [
  { id: 'v1', customerId: 'c1', carId: 'car1', technicianId: 'u2', entryDate: '2026-06-11', entryOdometer: 45200, notes: 'تبديل زيت وفحص دوري عام', status: 'سُلّمت', createdAt: '2026-06-11', priority: 'normal', statusLog: [{ status: 'سُلّمت', changedAt: '2026-06-11T12:00:00Z', changedBy: 'system' }] },
  { id: 'v2', customerId: 'c2', carId: 'car3', technicianId: 'u2', entryDate: '2026-06-16', entryOdometer: 60100, notes: 'فحص بريكات وصوت طقطقة بالدوران', status: 'قيد التنفيذ', createdAt: '2026-06-16', priority: 'urgent', statusLog: [{ status: 'قيد التنفيذ', changedAt: '2026-06-16T09:30:00Z', changedBy: 'system' }] },
  { id: 'v3', customerId: 'c3', carId: 'car5', technicianId: 'u2', entryDate: '2026-05-24', entryOdometer: 94800, notes: 'ضعف في تبريد المكيف وتبديل البطارية', status: 'سُلّمت', createdAt: '2026-05-24', priority: 'vip', statusLog: [{ status: 'سُلّمت', changedAt: '2026-05-24T15:20:00Z', changedBy: 'system' }] },
  { id: 'v4', customerId: 'c1', carId: 'car2', technicianId: 'u2', entryDate: '2026-04-19', entryOdometer: 81500, notes: 'رجة بالسرعة العالية وتدوير إطارات', status: 'سُلّمت', createdAt: '2026-04-19', priority: 'normal', statusLog: [{ status: 'سُلّمت', changedAt: '2026-04-19T10:15:00Z', changedBy: 'system' }] },
  { id: 'v5', customerId: 'c2', carId: 'car4', technicianId: 'u2', entryDate: '2026-03-15', entryOdometer: 29500, notes: 'فحص صيانة 30 الف', status: 'سُلّمت', createdAt: '2026-03-15', priority: 'normal', statusLog: [{ status: 'سُلّمت', changedAt: '2026-03-15T11:00:00Z', changedBy: 'system' }] },
  { id: 'v6', customerId: 'c3', carId: 'car6', technicianId: 'u2', entryDate: '2026-02-08', entryOdometer: 154200, notes: 'صعوبة بالتشغيل صباحاً. الزيت متجاوز!', status: 'سُلّمت', createdAt: '2026-02-08', priority: 'urgent', statusLog: [{ status: 'سُلّمت', changedAt: '2026-02-08T16:40:00Z', changedBy: 'system' }] },
  { id: 'v7', customerId: 'c1', carId: 'car1', technicianId: 'u2', entryDate: '2026-01-21', entryOdometer: 42000, notes: 'تبديل زيت وفلتر', status: 'سُلّمت', createdAt: '2026-01-21', priority: 'normal', statusLog: [{ status: 'سُلّمت', changedAt: '2026-01-21T09:00:00Z', changedBy: 'system' }] }
];

const initialVisitServices: VisitService[] = [
  { 
    id: 'vs1', visitId: 'v1', serviceId: 's1', serviceName: 'زيت المحرك (Engine Oil)', categoryName: 'الزيوت (Oils)', qty: 4, unit: 'لتر', unitPrice: 8000, totalPrice: 32000, notes: 'زيت كاسترول ماجناتيك 5W-30',
    oilDetails: {
      brand: 'Castrol', productName: 'Castrol Magnatec', viscosity: '5W-30', litersUsed: 4, pricePerLiter: 8000, oilType: 'Fully Synthetic',
      currentOdometer: 45200, nextChangeOdometer: 50200, nextChangeIntervalKm: 5000, nextChangeDate: '2026-09-11', notes: 'زيت محرك أصلي ممتاز'
    }
  },
  { id: 'vs2', visitId: 'v1', serviceId: 's7', serviceName: 'فلتر الزيت', categoryName: 'الفلاتر (Filters)', qty: 1, unit: 'قطعة', unitPrice: 15000, totalPrice: 15000, notes: 'فلتر تويوتا أصلي', oilDetails: null },
  { id: 'vs3', visitId: 'v1', serviceId: 's15', serviceName: 'فحص شامل للسيارة', categoryName: 'الفحص العام (General Inspection)', qty: 1, unit: 'خدمة', unitPrice: 30000, totalPrice: 30000, notes: '', oilDetails: null },
  { id: 'vs4', visitId: 'v2', serviceId: 's11', serviceName: 'تبديل تيل الفرامل', categoryName: 'الفرامل (Brakes)', qty: 1, unit: 'خدمة', unitPrice: 35000, totalPrice: 35000, notes: 'فحمات بريك أمامية', oilDetails: null },
  { id: 'vs5', visitId: 'v2', serviceId: 's14', serviceName: 'ميزان الإطارات (محاذاة)', categoryName: 'الإطارات (Tires)', qty: 1, unit: 'خدمة', unitPrice: 25000, totalPrice: 25000, notes: '', oilDetails: null },
  { id: 'vs6', visitId: 'v3', serviceId: 's13', serviceName: 'شحن فريون', categoryName: 'التكييف (AC)', qty: 1, unit: 'خدمة', unitPrice: 50000, totalPrice: 50000, notes: 'غاز أمريكي', oilDetails: null },
  { id: 'vs7', visitId: 'v3', serviceId: 's10', serviceName: 'فلتر الوقود', categoryName: 'الفلاتر (Filters)', qty: 1, unit: 'قطعة', unitPrice: 20000, totalPrice: 20000, notes: 'مصفى ديزل أصلي كيا', oilDetails: null },
  { id: 'vs8', visitId: 'v4', serviceId: 's14', serviceName: 'ميزان الإطارات (محاذاة)', categoryName: 'الإطارات (Tires)', qty: 1, unit: 'خدمة', unitPrice: 25000, totalPrice: 25000, notes: '', oilDetails: null },
  { id: 'vs10', visitId: 'v5', serviceId: 's15', serviceName: 'فحص شامل للسيارة', categoryName: 'الفحص العام (General Inspection)', qty: 1, unit: 'خدمة', unitPrice: 30000, totalPrice: 30000, notes: '', oilDetails: null },
  { 
    id: 'vs11', visitId: 'v5', serviceId: 's1', serviceName: 'زيت المحرك (Engine Oil)', categoryName: 'الزيوت (Oils)', qty: 5, unit: 'لتر', unitPrice: 9000, totalPrice: 45000, notes: 'زيت موبيل 1 لزوجة 0W-20',
    oilDetails: {
      brand: 'Mobil', productName: 'Mobil 1', viscosity: '0W-20', litersUsed: 5, pricePerLiter: 9000, oilType: 'Fully Synthetic',
      currentOdometer: 29500, nextChangeOdometer: 34500, nextChangeIntervalKm: 5000, nextChangeDate: '2026-06-15', notes: 'تغيير صيانة 30 الف'
    }
  },
  { 
    id: 'vs12', visitId: 'v6', serviceId: 's6', serviceName: 'زيت التبريد / الكولنت (Coolant)', categoryName: 'الزيوت (Oils)', qty: 4, unit: 'لتر', unitPrice: 6000, totalPrice: 24000, notes: 'تويوتا كولنت أحمر 50%',
    oilDetails: {
      brand: 'Toyota', productName: 'Super Long Life Coolant', viscosity: '', litersUsed: 4, pricePerLiter: 6000,
      flushType: 'Full Flush', color: 'أحمر', concentration: '50%', notes: 'غسيل كامل للراديتر وتعبئة سائل أحمر'
    }
  },
  {
    id: 'vs15', visitId: 'v6', serviceId: 's1', serviceName: 'زيت المحرك (Engine Oil)', categoryName: 'الزيوت (Oils)', qty: 6, unit: 'لتر', unitPrice: 8500, totalPrice: 51000, notes: 'زيت موتل معدني 20W-50 - متجاوز الآن!',
    oilDetails: {
      brand: 'Motul', productName: 'Motul 20W-50', viscosity: '20W-50', litersUsed: 6, pricePerLiter: 8500, oilType: 'Mineral',
      currentOdometer: 149000, nextChangeOdometer: 154000, nextChangeIntervalKm: 5000, nextChangeDate: '2026-05-08', notes: 'متجاوز! العداد الحالي 155 ألف.'
    }
  },
  { 
    id: 'vs13', visitId: 'v7', serviceId: 's1', serviceName: 'زيت المحرك (Engine Oil)', categoryName: 'الزيوت (Oils)', qty: 4, unit: 'لتر', unitPrice: 8000, totalPrice: 32000, notes: 'شل هيلكس 5W-40',
    oilDetails: {
      brand: 'Shell', productName: 'Shell Helix Ultra', viscosity: '5W-40', litersUsed: 4, pricePerLiter: 8000, oilType: 'Fully Synthetic',
      currentOdometer: 42000, nextChangeOdometer: 47000, nextChangeIntervalKm: 5000, nextChangeDate: '2026-04-21', notes: ''
    }
  },
  { id: 'vs14', visitId: 'v7', serviceId: 's7', serviceName: 'فلتر الزيت', categoryName: 'الفلاتر (Filters)', qty: 1, unit: 'قطعة', unitPrice: 15000, totalPrice: 15000, notes: '', oilDetails: null }
];

const initialInvoices: Invoice[] = [
  { id: 'inv1', visitId: 'v1', invoiceNumber: 'INV-0001', subtotal: 77000, discount: 2000, discountType: 'flat', tax: 0, total: 75000, status: 'Paid', issuedAt: '2026-06-11' },
  { id: 'inv2', visitId: 'v3', invoiceNumber: 'INV-0002', subtotal: 70000, discount: 5000, discountType: 'flat', tax: 0, total: 65000, status: 'Paid', issuedAt: '2026-05-24' },
  { id: 'inv3', visitId: 'v4', invoiceNumber: 'INV-0003', subtotal: 25000, discount: 0, discountType: 'flat', tax: 0, total: 25000, status: 'Paid', issuedAt: '2026-04-19' },
  { id: 'inv4', visitId: 'v5', invoiceNumber: 'INV-0004', subtotal: 75000, discount: 0, discountType: 'flat', tax: 0, total: 75000, status: 'Paid', issuedAt: '2026-03-15' },
  { id: 'inv5', visitId: 'v6', invoiceNumber: 'INV-0005', subtotal: 75000, discount: 0, discountType: 'flat', tax: 0, total: 75000, status: 'Paid', issuedAt: '2026-02-08' },
  { id: 'inv6', visitId: 'v7', invoiceNumber: 'INV-0006', subtotal: 47000, discount: 0, discountType: 'flat', tax: 0, total: 47000, status: 'Paid', issuedAt: '2026-01-21' }
];

const initialPayments: Payment[] = [
  { id: 'p1', invoiceId: 'inv1', visitId: 'v1', customerId: 'c1', method: 'cash', status: 'paid', totalAmount: 75000, paidAmount: 75000, remainingAmount: 0, dueDate: '2026-06-11', paidDate: '2026-06-11' },
  { id: 'p2', invoiceId: 'inv2', visitId: 'v3', customerId: 'c3', method: 'partial', status: 'partial', totalAmount: 65000, paidAmount: 50000, remainingAmount: 15000, dueDate: '2026-06-25', notes: 'دفع 50 الف دينار متبقي 15 الف' },
  { id: 'p3', invoiceId: 'inv3', visitId: 'v4', customerId: 'c1', method: 'deferred', status: 'unpaid', totalAmount: 25000, paidAmount: 0, remainingAmount: 25000, dueDate: '2026-06-05', notes: 'حساب آجل للراتب' },
  { id: 'p4', invoiceId: 'inv4', visitId: 'v5', customerId: 'c2', method: 'card', status: 'paid', totalAmount: 75000, paidAmount: 75000, remainingAmount: 0, dueDate: '2026-03-15', paidDate: '2026-03-15' },
  { id: 'p5', invoiceId: 'inv5', visitId: 'v6', customerId: 'c3', method: 'partial', status: 'partial', totalAmount: 75000, paidAmount: 40000, remainingAmount: 35000, dueDate: '2026-06-10', notes: 'زبون يوسف عمر دفع 40 الف وباقي 35 الف ميزانية' },
  { id: 'p6', invoiceId: 'inv6', visitId: 'v7', customerId: 'c1', method: 'transfer', status: 'paid', totalAmount: 47000, paidAmount: 47000, remainingAmount: 0, dueDate: '2026-01-21', paidDate: '2026-01-21' }
];

const initialPaymentLogs: PaymentLog[] = [
  { id: 'pl1', paymentId: 'p1', date: '2026-06-11', amount: 75000, method: 'cash', recordedBy: 'u3' },
  { id: 'pl2', paymentId: 'p2', date: '2026-05-24', amount: 50000, method: 'cash', recordedBy: 'u3' },
  { id: 'pl3', paymentId: 'p4', date: '2026-03-15', amount: 75000, method: 'card', recordedBy: 'u3' },
  { id: 'pl4', paymentId: 'p5', date: '2026-02-08', amount: 40000, method: 'cash', recordedBy: 'u3' },
  { id: 'pl5', paymentId: 'p6', date: '2026-01-21', amount: 47000, method: 'transfer', recordedBy: 'u3' }
];

export const useVisitStore = create<VisitState>()(
  persist(
    (set, get) => ({
      visits: initialVisits,
      visitServices: initialVisitServices,
      invoices: initialInvoices,
      payments: initialPayments,
      visitStatusLogs: [],
      paymentsLog: initialPaymentLogs,

      addVisit: (visitData) => {
        const { operatorId, ...rest } = visitData;
        const id = crypto.randomUUID();
        const newVisit: Visit = {
          priority: 'normal',
          receptionPhotos: [],
          statusLog: [
            {
              status: 'استقبلت',
              changedAt: new Date().toISOString(),
              changedBy: operatorId || 'system'
            }
          ],
          ...rest,
          id,
          status: 'استقبلت',
          createdAt: new Date().toISOString().split('T')[0]
        };
        set((state) => ({ visits: [...state.visits, newVisit] }));

        // Status log initial
        const log: VisitStatusLog = {
          id: crypto.randomUUID(),
          visitId: id,
          status: 'استقبلت',
          changedAt: new Date().toISOString(),
          changedBy: operatorId || 'system',
          note: 'استقبال السيارة وتسجيل الزيارة'
        };
        set((state) => ({ visitStatusLogs: [...state.visitStatusLogs, log] }));

        return id;
      },

      updateVisit: (id, updates) => {
        const { operatorId, statusNote, ...rest } = updates;
        const oldVisit = get().visits.find((v) => v.id === id);
        
        set((state) => ({
          visits: state.visits.map((v) => {
            if (v.id === id) {
              const updatedStatusLog = v.statusLog ? [...v.statusLog] : [];
              if (rest.status && rest.status !== v.status) {
                updatedStatusLog.push({
                  status: rest.status,
                  changedAt: new Date().toISOString(),
                  changedBy: operatorId || 'system'
                });
              }
              return { ...v, ...rest, statusLog: updatedStatusLog };
            }
            return v;
          })
        }));

        if (rest.status && oldVisit && rest.status !== oldVisit.status) {
          const log: VisitStatusLog = {
            id: crypto.randomUUID(),
            visitId: id,
            status: rest.status,
            changedAt: new Date().toISOString(),
            changedBy: operatorId || 'system',
            note: statusNote || 'تغيير حالة الزيارة'
          };
          set((state) => ({ visitStatusLogs: [...state.visitStatusLogs, log] }));
        }
      },

      deleteVisit: (id) => {
        set((state) => ({
          visits: state.visits.filter((v) => v.id !== id),
          visitServices: state.visitServices.filter((vs) => vs.visitId !== id),
          invoices: state.invoices.filter((inv) => inv.visitId !== id),
          payments: state.payments.filter((p) => p.visitId !== id),
          visitStatusLogs: state.visitStatusLogs.filter((log) => log.visitId !== id)
        }));
      },

      addVisitService: (vsData) => {
        const newVS: VisitService = {
          ...vsData,
          id: crypto.randomUUID()
        };
        set((state) => ({ visitServices: [...state.visitServices, newVS] }));
      },

      removeVisitService: (id) => {
        set((state) => ({
          visitServices: state.visitServices.filter((vs) => vs.id !== id)
        }));
      },

      updateVisitService: (id, updates) => {
        set((state) => ({
          visitServices: state.visitServices.map((vs) => (vs.id === id ? { ...vs, ...updates } : vs))
        }));
      },

      generateInvoice: (visitId, invoiceData) => {
        const { prefix = 'INV-', padding = 4, includeYear = false, ...data } = invoiceData;
        const id = crypto.randomUUID();
        
        const prevInvoices = get().invoices;
        let lastNum = 0;
        prevInvoices.forEach((inv) => {
          const parts = inv.invoiceNumber.split('-');
          const numPart = parts[parts.length - 1];
          const num = parseInt(numPart);
          if (!isNaN(num) && num > lastNum) lastNum = num;
        });

        const nextNum = lastNum + 1;
        const paddedNum = String(nextNum).padStart(padding, '0');
        const yearStr = includeYear ? `${new Date().getFullYear()}-` : '';
        const invoiceNumber = `${prefix}${yearStr}${paddedNum}`;

        const newInvoice: Invoice = {
          ...data,
          id,
          visitId,
          invoiceNumber,
          issuedAt: new Date().toISOString().split('T')[0]
        };

        set((state) => ({ invoices: [...state.invoices, newInvoice] }));
        return id;
      },

      updateInvoiceStatus: (id, status) => {
        set((state) => ({
          invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, status } : inv))
        }));
      },

      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
          payments: state.payments.filter((p) => p.invoiceId !== id)
        }));
      },

      addPayment: (paymentData) => {
        const { operatorId, ...data } = paymentData;
        const id = crypto.randomUUID();
        const newPayment: Payment = {
          ...data,
          id
        };
        set((state) => ({ payments: [...state.payments, newPayment] }));

        if (data.paidAmount > 0) {
          const log: PaymentLog = {
            id: crypto.randomUUID(),
            paymentId: id,
            date: new Date().toISOString().split('T')[0],
            amount: data.paidAmount,
            method: data.method,
            recordedBy: operatorId || 'system'
          };
          set((state) => ({ paymentsLog: [...state.paymentsLog, log] }));
        }

        return id;
      },

      updatePayment: (id, updates) => {
        const { operatorId, paymentAmount, ...data } = updates;
        const oldPayment = get().payments.find((p) => p.id === id);
        if (!oldPayment) return;

        const updatedPaid = oldPayment.paidAmount + (paymentAmount || 0);
        const updatedRemaining = Math.max(0, oldPayment.totalAmount - updatedPaid);
        const updatedStatus = updatedRemaining === 0 ? 'paid' : 'partial';

        set((state) => ({
          payments: state.payments.map((p) => (p.id === id ? { 
            ...p, 
            ...data, 
            paidAmount: updatedPaid,
            remainingAmount: updatedRemaining,
            status: updatedStatus,
            paidDate: updatedRemaining === 0 ? new Date().toISOString().split('T')[0] : p.paidDate
          } : p))
        }));

        if (paymentAmount && paymentAmount > 0) {
          const log: PaymentLog = {
            id: crypto.randomUUID(),
            paymentId: id,
            date: new Date().toISOString().split('T')[0],
            amount: paymentAmount,
            method: data.method || oldPayment.method,
            recordedBy: operatorId || 'system'
          };
          set((state) => ({ paymentsLog: [...state.paymentsLog, log] }));
        }
      },

      deletePayment: (id) => {
        const payment = get().payments.find(p => p.id === id);
        if (!payment) return;
        set((state) => ({
          payments: state.payments.filter((p) => p.id !== id),
          paymentsLog: state.paymentsLog.filter((log) => log.paymentId !== id)
        }));
      },

      markPaymentAsPaid: (id, operatorId) => {
        const payment = get().payments.find((p) => p.id === id);
        if (!payment) return;

        const amountToPay = payment.remainingAmount;
        if (amountToPay <= 0) return;

        set((state) => ({
          payments: state.payments.map((p) => (p.id === id ? { 
            ...p, 
            status: 'paid', 
            paidAmount: p.totalAmount, 
            remainingAmount: 0, 
            paidDate: new Date().toISOString().split('T')[0] 
          } : p))
        }));

        const log: PaymentLog = {
          id: crypto.randomUUID(),
          paymentId: id,
          date: new Date().toISOString().split('T')[0],
          amount: amountToPay,
          method: payment.method,
          recordedBy: operatorId || 'system'
        };
        set((state) => ({ paymentsLog: [...state.paymentsLog, log] }));
      }
    }),
    {
      name: 'nozzle-visit-store',
      version: 1
    }
  )
);
