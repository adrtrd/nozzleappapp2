import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { useSettingsStore } from './settingsStore';
import { useAuthStore } from './authStore';
import { useActivityLogStore } from './activityLogStore';

export interface VisitService {
  id: string;
  serviceId: string;
  serviceName: string;
  categoryId: string;
  categoryName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes: string;
  oilDetails: {
    brand?: string;
    productName?: string;
    oilType?: string;
    viscosity?: string;
    litersUsed?: number;
    pricePerLiter?: number;
    dotGrade?: string;
    axle?: string;
    flushType?: string;
    currentOdometer?: number;
    nextChangeOdometer?: number;
    nextChangeDate?: string;
    nextChangeIntervalKm?: number;
    refrigerantType?: string;
    pressureBefore?: string;
    pressureAfter?: string;
    notes?: string;
    transmissionType?: string;
    color?: string;
    concentration?: string;
  } | null;

  // Compatibility fields
  visitId?: string;
  sortOrder?: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'electronic' | 'deferred' | any;
  isDeferred: boolean;
  deferredDueDate?: string;
  notes: string;
  paidAt: string;

  // Compatibility fields
  visitId?: string;
  invoiceId?: string;
  customerId?: string;
  status?: string;
  totalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  dueDate?: string;
  paidDate?: string;
  recordedBy?: string;
  deferredGuarantor?: string;
  methodDetails?: {
    receiptNumber?: string;
    bankName?: string;
    platform?: string;
  };
}

export interface Visit {
  id: string;
  customerId: string;
  carId: string;
  technicianName: string;
  technicianId?: string;
  status: 'received' | 'in_progress' | 'done' | 'delivered' | 'Completed' | 'منتظر' | 'استقبلت' | 'قيد الفحص' | 'قيد التنفيذ' | 'انتهت' | 'سُلّمت' | any;
  priority: 'normal' | 'urgent' | 'vip';
  entryDate: string;
  entryOdometer: number;
  exitDate?: string;
  exitOdometer?: number;
  customerComplaint: string;
  technicianNotes: string;
  notes?: string;
  receptionPhotos?: any[];
  createdBy?: string;
  internalRating?: number;
  closingNotes?: string;
  receptionNotes?: string;
  statusLog?: any[];
  services: VisitService[];
  payments: Payment[];
  subtotal: number;
  discountType: 'amount' | 'percent';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  totalPaid: number;
  totalRemaining: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid' | 'deferred';
  invoiceNumber?: string;
  invoiceIssued: boolean;
  createdAt: string;
  updatedAt: string;

  // Lock fields
  isLocked: boolean;
  lockedAt: string | null;
  lockedBy: string | null;
  lockReason: string | null;
}

interface VisitStore {
  visits: Visit[];
  addVisit: (visit: Omit<Visit,
    'id'|'createdAt'|'updatedAt'|'subtotal'|
    'discountAmount'|'taxAmount'|'total'|
    'totalPaid'|'totalRemaining'|'paymentStatus'|
    'invoiceIssued'|'isLocked'|'lockedAt'|'lockedBy'|'lockReason'>) => Visit;
  updateVisit: (id: string, updates: Partial<Visit>) => void;
  deleteVisit: (id: string) => void;
  addServiceToVisit: (visitId: string,
                      service: Omit<VisitService,'id'>) => void;
  removeServiceFromVisit: (visitId: string,
                           serviceId: string) => void;
  addPayment: (visitId: string,
               payment: Omit<Payment,'id'|'paidAt'>) => void;
  removePayment: (visitId: string, paymentId: string) => void;
  closeVisit: (visitId: string, closeData: any) => string;
  getVisitsByCustomer: (customerId: string) => Visit[];
  getVisitsByCar: (carId: string) => Visit[];
  getVisitById: (id: string) => Visit | undefined;
  recalculateVisit: (visitId: string) => void;
  isVisitLocked: (visitId: string) => boolean;
  unlockVisit: (visitId: string, reason: string) => boolean;
}

function calcTotals(visit: any): Partial<Visit> {
  const services      = visit.services  || [];
  const payments      = visit.payments  || [];

  const subtotal      = services.reduce(
    (s: number, srv: any) => s + (Number(srv.totalPrice) || 0), 0
  );

  const discountAmount =
    visit.discountType === 'percent'
      ? (subtotal * (Number(visit.discountValue) || 0)) / 100
      : (Number(visit.discountValue) || 0);

  const afterDiscount = subtotal - discountAmount;
  const taxAmount     = (afterDiscount * (Number(visit.taxRate) || 0)) / 100;
  const total         = afterDiscount + taxAmount;

  const totalPaid     = payments.reduce(
    (s: number, p: any) => s + (Number(p.amount) || 0), 0
  );
  const totalRemaining = Math.max(0, total - totalPaid);

  const paymentStatus =
    total === 0                         ? 'unpaid'   :
    totalPaid >= total                  ? 'paid'     :
    totalPaid > 0                       ? 'partial'  :
    payments.some((p: any) => p.isDeferred) ? 'deferred' : 'unpaid';

  return {
    subtotal, discountAmount, taxAmount,
    total, totalPaid, totalRemaining, paymentStatus,
  };
}

export const useVisitStore = create<VisitStore>()(
  persist(
    (set, get) => ({
      visits: [],

      isVisitLocked: (visitId: string): boolean => {
        const visit = get().visits.find((v) => v.id === visitId);
        return visit?.isLocked === true;
      },

      addVisit: (visitData) => {
        const newVisit: Visit = {
          ...visitData,
          id: `vis-${crypto.randomUUID()}`,
          status: visitData.status || 'منتظر',
          services: [],
          payments: [],
          subtotal: 0,
          discountAmount: 0,
          taxAmount: 0,
          total: 0,
          totalPaid: 0,
          totalRemaining: 0,
          paymentStatus: 'unpaid',
          invoiceIssued: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isLocked: false,
          lockedAt: null,
          lockedBy: null,
          lockReason: null,
        };
        set((s) => ({ visits: [...s.visits, newVisit] }));
        return newVisit;
      },

      updateVisit: (id, updates) => {
        if (get().isVisitLocked(id)) {
          console.warn('Visit is locked — cannot update visit info');
          toast.error('الزيارة مقفلة — لا يمكن تعديل البيانات');
          return;
        }
        set((s) => ({
          visits: s.visits.map((v) =>
            v.id === id
              ? { ...v, ...updates,
                  updatedAt: new Date().toISOString() }
              : v
          ),
        }));
      },

      deleteVisit: (id) => {
        const visit = get().visits.find((v) => v.id === id);
        if (!visit) return;
        const currentUser = useAuthStore.getState().currentUser;
        
        if (visit.isLocked && currentUser?.role !== 'admin') {
          toast.error('الزيارة مقفلة — فقط المدير يمكنه حذفها');
          return;
        }

        set((s) => ({
          visits: s.visits.filter((v) => v.id !== id),
        }));

        // Log DELETE_VISIT action
        useActivityLogStore.getState().addLog({
          action: 'DELETE_VISIT',
          entity: 'visit',
          entityId: id,
          details: `حذف كرت صيانة الزيارة رقم: ${id}`,
          user: currentUser?.name || 'النظام',
        });
        toast.success('تم حذف الزيارة');
      },

      addServiceToVisit: (visitId, service) => {
        if (get().isVisitLocked(visitId)) {
          console.warn('Visit is locked — cannot add service');
          toast.error('الزيارة مقفلة — لا يمكن إضافة خدمة');
          return;
        }
        set((state) => {
          const visits = state.visits.map((v) => {
            if (v.id !== visitId) return v;
            const newService = {
              ...service,
              id: `vsrv-${crypto.randomUUID()}`,
            };
            const updated = {
              ...v,
              services:  [...(v.services || []), newService],
              updatedAt: new Date().toISOString(),
            };
            return { ...updated, ...calcTotals(updated) };
          });
          return { visits };
        });
      },

      removeServiceFromVisit: (visitId, serviceId) => {
        if (get().isVisitLocked(visitId)) {
          console.warn('Visit is locked — cannot remove service');
          toast.error('الزيارة مقفلة — لا يمكن حذف خدمة');
          return;
        }
        set((state) => {
          const visits = state.visits.map((v) => {
            if (v.id !== visitId) return v;
            const updated = {
              ...v,
              services: (v.services || []).filter(
                (s) => s.id !== serviceId
              ),
              updatedAt: new Date().toISOString(),
            };
            return { ...updated, ...calcTotals(updated) };
          });
          return { visits };
        });
      },

      addPayment: (visitId, paymentData) => {
        set((state) => {
          const visits = state.visits.map((v) => {
            if (v.id !== visitId) return v;

            const newPayment = {
              ...paymentData,
              id:     `pay-${crypto.randomUUID()}`,
              paidAt: new Date().toISOString(),
            };

            const updatedVisit = {
              ...v,
              payments:  [...(v.payments || []), newPayment],
              updatedAt: new Date().toISOString(),
            };

            // RECALCULATE TOTALS IMMEDIATELY
            const totals = calcTotals(updatedVisit);

            return { ...updatedVisit, ...totals };
          });
          return { visits };
        });

        const currentUser = useAuthStore.getState().currentUser;
        useActivityLogStore.getState().addLog({
          action: 'ADD_PAYMENT',
          entity: 'payment',
          entityId: visitId,
          details: `سداد دفعة بقيمة ${paymentData.amount.toLocaleString('ar-IQ')} د.ع طريقة: ${paymentData.method}`,
          user: currentUser?.name || 'النظام',
        });
      },

      removePayment: (visitId, paymentId) => {
        const visit = get().visits.find((v) => v.id === visitId);
        const currentUser = useAuthStore.getState().currentUser;

        if (visit?.isLocked && currentUser?.role !== 'admin') {
          toast.error('الزيارة مقفلة — فقط المدير يمكنه حذف الدفعات');
          return;
        }

        set((state) => {
          const visits = state.visits.map((v) => {
            if (v.id !== visitId) return v;
            const updatedVisit = {
              ...v,
              payments: (v.payments || []).filter(
                (p) => p.id !== paymentId
              ),
              updatedAt: new Date().toISOString(),
            };
            return { ...updatedVisit, ...calcTotals(updatedVisit) };
          });
          return { visits };
        });

        useActivityLogStore.getState().addLog({
          action: 'DELETE_PAYMENT',
          entity: 'payment',
          entityId: paymentId,
          details: `حذف دفعة رقم ${paymentId} للزيارة ${visitId}`,
          user: currentUser?.name || 'النظام',
        });
      },

      closeVisit: (visitId, closeData) => {
        const existingVisit = get().visits.find((v) => v.id === visitId);
        const invoiceNumber =
          existingVisit?.invoiceNumber ||
          useSettingsStore.getState().generateInvoiceNumber();
        const currentUser =
          useAuthStore.getState().currentUser;

        set((state: any) => {
          const visits = state.visits.map((v: any) => {
            if (v.id !== visitId) return v;

            // Add final payment if provided
            let payments = [...(v.payments || [])];
            if (closeData.payment &&
                Number(closeData.payment.amount) > 0) {
              payments.push({
                ...closeData.payment,
                id:     `pay-${crypto.randomUUID()}`,
                paidAt: new Date().toISOString(),
              });
            }

            const updatedVisit = {
              ...v,
              payments,
              status:          'delivered',
              isLocked:        true,          // ← LOCK IT
              lockedAt:        new Date().toISOString(),
              lockedBy:        currentUser?.name || 'النظام',
              lockReason:      'visit_closed',
              exitDate:        closeData.exitDate ||
                               new Date().toISOString(),
              exitOdometer:    closeData.exitOdometer ||
                               v.entryOdometer,
              technicianNotes: closeData.notes || v.technicianNotes,
              invoiceNumber,
              invoiceIssued:   true,
              updatedAt:       new Date().toISOString(),
            };

            // RECALCULATE with final payment included
            const totals = calcTotals(updatedVisit);
            return { ...updatedVisit, ...totals };
          });
          return { visits };
        });

        // Log CLOSE_VISIT action
        useActivityLogStore.getState().addLog({
          action: 'CLOSE_VISIT',
          entity: 'visit',
          entityId: visitId,
          details: existingVisit?.invoiceIssued
            ? `تحديث وإعادة إغلاق الزيارة للفاتورة رقم ${invoiceNumber}`
            : `إغلاق الزيارة وإصدار الفاتورة رقم ${invoiceNumber}`,
          user: currentUser?.name || 'النظام',
        });

        return invoiceNumber;
      },

      unlockVisit: (visitId, reason) => {
        const currentUser = useAuthStore.getState().currentUser;

        // Only Admin can unlock
        if (currentUser?.role !== 'admin') {
          toast.error('فقط المدير يمكنه فك قفل الزيارة');
          return false;
        }

        set((state) => ({
          visits: state.visits.map((v) =>
            v.id === visitId
              ? {
                  ...v,
                  isLocked:  false,
                  lockedAt:  null,
                  lockedBy:  null,
                  lockReason: null,
                  updatedAt: new Date().toISOString(),
                }
              : v
          ),
        }));

        // Log the unlock action
        useActivityLogStore.getState().addLog({
          action:   'UNLOCK_VISIT',
          entity:   'visit',
          entityId: visitId,
          details:  reason,
          user:     currentUser?.name || '',
        });

        toast.success('تم فك قفل الزيارة بنجاح');
        return true;
      },

      getVisitsByCustomer: (customerId) =>
        get().visits.filter((v) => v.customerId === customerId),

      getVisitsByCar: (carId) =>
        get().visits.filter((v) => v.carId === carId),

      getVisitById: (id) =>
        get().visits.find((v) => v.id === id),

      recalculateVisit: (visitId) => {
        set((s) => ({
          visits: s.visits.map((v) =>
            v.id === visitId
              ? { ...v, ...calcTotals(v) }
              : v
          ),
        }));
      },
    }),
    {
      name: 'visit-store-v1',
      version: 1,
    }
  )
);
