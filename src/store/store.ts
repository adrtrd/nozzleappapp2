import { useMemo } from 'react';
import { useAuthStore, UserRole, UserPermissions } from './authStore';
import { useUserStore, User } from './userStore';
import { useActivityLogStore, ActivityLog } from './activityLogStore';
import { useCustomerStore, Customer, Car, CustomerDocument } from './customerStore';
import { useServiceStore, ServiceCategory, Subcategory, ServiceItem } from './useServiceStore';
import { useVisitStore, Visit, VisitService, Payment } from './useVisitStore';
import { useInvoiceSettingsStore, InvoiceSettings } from './invoiceSettingsStore';
import { useNotificationStore, Notification } from './notificationStore';
import { useSettingsStore, WarrantyTemplate, convertWorkingHoursObjToArray } from './settingsStore';
import { useInspectionStore, VehicleInspection } from './useInspectionStore';

// Define compatibility types
export type GlobalSettings = any;
export type WorkingDay = any;
export type Branch = any;

export type Service = ServiceItem;
export type ServicePackage = any;
export type VisitStatus = 'received' | 'in_progress' | 'done' | 'delivered' | 'Completed' | 'منتظر' | 'استقبلت' | 'قيد الفحص' | 'قيد التنفيذ' | 'انتهت' | 'سُلّمت' | 'Open' | 'In Progress' | 'Cancelled' | any;
export type Invoice = any;
export type InvoiceStatus = any;
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'electronic' | 'deferred' | 'partial' | any;
export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'deferred';
export type VisitStatusLog = any;
export type PaymentLog = any;
export type OilServiceDetails = any;

// Export all types from sub-stores so components import them normally
export type {
  User,
  UserRole,
  UserPermissions,
  ActivityLog,
  Customer,
  Car,
  CustomerDocument,
  ServiceCategory,
  Subcategory,
  Visit,
  VisitService,
  Payment,
  InvoiceSettings,
  Notification,
  WarrantyTemplate,
  VehicleInspection
};

// Also export Settings alias for settings to prevent breaks
export type Settings = GlobalSettings;

// Unified useStore hook
export function useStore(): any;
export function useStore<T>(selector: (state: any) => T): T;
export function useStore<T>(selector?: (state: any) => T): T | any {
  const auth = useAuthStore();
  const userStore = useUserStore();
  const activityLog = useActivityLogStore();
  const customer = useCustomerStore();
  const service = useServiceStore();
  const visit = useVisitStore();
  const settings = useSettingsStore();
  const invoiceSettings = useInvoiceSettingsStore();
  const notifications = useNotificationStore();
  const inspection = useInspectionStore();

  const merged = useMemo(() => {
    const legacySettings = {
      centerName: settings.invoice?.centerName || '',
      tagline: settings.invoice?.tagline || '',
      phone: settings.invoice?.phone || '',
      email: settings.invoice?.email || '',
      address: settings.invoice?.address || '',
      website: settings.invoice?.website || '',
      commercialReg: settings.invoice?.commercialReg || '',
      taxNumber: settings.invoice?.taxNumber || '',
      workingHours: convertWorkingHoursObjToArray(settings.workingHours),
      holidays: settings.holidays || [],
      currency: settings.currency || 'IQD',
      taxRate: settings.taxRate || 0,
      paymentMethods: settings.paymentMethods || {},
      maxDeferredDays: settings.maxDeferredDays || 30,
      defaultPaperSize: settings.invoice?.paperSize || 'A4',
      printMargins: settings.invoice?.printMargins || 12,
      autoPrintOnComplete: settings.invoice?.autoPrint || false,
      defaultPrintCopies: settings.invoice?.printCopies || 1,
    };

    const visits = visit.visits || [];
    const serviceCategories = service.categories || [];
    const services = (service.services || []).map(s => ({
      ...s,
      price: s.defaultPrice,
      status: s.isActive ? 'active' : 'inactive',
      linkedFields: {
        requiresBrand: s.requiresBrand,
        requiresViscosity: s.requiresViscosity,
        requiresLiters: s.requiresLiters,
        requiresNextOdometer: s.requiresNextOdometer,
        requiresNextDate: s.requiresNextDate,
        requiresFlushType: s.requiresFlushType,
        requiresDOT: s.requiresDOT,
        requiresAxle: s.requiresAxle,
      },
      brandsForCategory: s.brands || [],
      nextIntervalKm: s.defaultIntervalKm,
      nextIntervalDays: s.defaultIntervalDays,
      oilSubtype: s.subcategoryId === 'sub-engine' || s.subcategoryId === 'sub1_1' ? 'engine' :
                  s.subcategoryId === 'sub-brake' || s.subcategoryId === 'sub1_2' ? 'brake' :
                  s.subcategoryId === 'sub-diff' || s.subcategoryId === 'sub1_3' ? 'differential' :
                  s.subcategoryId === 'sub-steering' || s.subcategoryId === 'sub1_4' ? 'steering' :
                  s.subcategoryId === 'sub-gear' || s.subcategoryId === 'sub1_5' ? 'transmission' :
                  s.subcategoryId === 'sub-coolant' || s.subcategoryId === 'sub1_6' ? 'coolant' : null,
    }));

    const derivedVisitServices = visits.flatMap(v => (v.services || []).map(s => ({
      ...s,
      visitId: v.id
    })));

    const derivedInvoices = visits.filter(v => v.invoiceIssued).map(v => ({
      id: `inv-${v.id}`,
      visitId: v.id,
      invoiceNumber: v.invoiceNumber || `INV-${v.id}`,
      subtotal: v.subtotal || 0,
      discount: v.discountValue || 0,
      discountAmount: v.discountAmount || 0,
      discountType: v.discountType === 'percent' ? 'percent' : 'flat',
      tax: v.taxRate || 0,
      taxAmount: v.taxAmount || 0,
      total: v.total || 0,
      issuedAt: v.createdAt,
      paymentStatus: v.paymentStatus,
    }));

    const derivedPayments = visits.filter(v => v.invoiceIssued).map(v => {
      const lastPayment = v.payments?.[v.payments.length - 1];
      const guarantor = v.payments?.find(p => p.deferredGuarantor)?.deferredGuarantor || '';
      const dueDate = v.payments?.find(p => p.deferredDueDate)?.deferredDueDate || v.exitDate || '';
      return {
        id: v.id, // Use visit ID as the unique payment/debt ID
        visitId: v.id,
        invoiceId: `inv-${v.id}`,
        customerId: v.customerId,
        status: v.paymentStatus,
        totalAmount: v.total,
        paidAmount: v.totalPaid,
        remainingAmount: v.totalRemaining,
        dueDate: dueDate,
        method: lastPayment?.method || (v.paymentStatus === 'deferred' ? 'deferred' : 'cash'),
        amount: v.totalRemaining,
        notes: v.closingNotes || lastPayment?.notes || '',
        paidAt: lastPayment?.paidAt || '',
        deferredGuarantor: guarantor,
      };
    });

    return {
      ...auth,
      ...userStore,
      ...activityLog,
      ...customer,
      ...service,
      ...visit,
      ...settings,
      ...invoiceSettings,
      ...notifications,
      ...inspection,
      serviceCategories,
      services,
      visitServices: derivedVisitServices,
      invoices: derivedInvoices,
      payments: derivedPayments,
      settings: legacySettings,
      invoiceSettings: settings.invoice,
      updateInvoiceSettings: settings.updateInvoice,

      // Compatibility wrappers
      addVisit: (visitData: any) => {
        const newVisit = visit.addVisit(visitData);
        return newVisit.id;
      },

      addVisitService: (vs: any) => {
        const { visitId, ...serviceFields } = vs;
        visit.addServiceToVisit(visitId, serviceFields);
      },

      removeVisitService: (serviceId: string) => {
        const v = visits.find(vis => (vis.services || []).some(s => s.id === serviceId));
        if (v) {
          visit.removeServiceFromVisit(v.id, serviceId);
        }
      },

      updateVisitService: (serviceId: string, updates: any) => {
        const v = visits.find(vis => (vis.services || []).some(s => s.id === serviceId));
        if (v) {
          useVisitStore.setState((s) => ({
            visits: s.visits.map((vis) => {
              if (vis.id !== v.id) return vis;
              const updatedServices = vis.services.map(srv => {
                if (srv.id === serviceId) {
                  const merged = { ...srv, ...updates };
                  merged.totalPrice = Number(merged.qty || 0) * Number(merged.unitPrice || 0);
                  return merged;
                }
                return srv;
              });
              return {
                ...vis,
                services: updatedServices,
                updatedAt: new Date().toISOString()
              };
            })
          }));
          visit.recalculateVisit(v.id);
        }
      },

      generateInvoice: (visitId: string, invoiceData: any) => {
        const v = visits.find(vis => vis.id === visitId);
        if (v) {
          const invoiceNumber = v.invoiceNumber || `INV-${visitId.replace('vis-', '')}`;
          visit.updateVisit(visitId, {
            invoiceIssued: true,
            invoiceNumber,
            discountType: invoiceData.discountType || 'amount',
            discountValue: invoiceData.discountValue || 0,
            taxRate: invoiceData.taxRate || 0,
          });
          visit.recalculateVisit(visitId);
          return `inv-${visitId}`;
        }
        return `inv-${visitId}`;
      },

      addPayment: (paymentData: any) => {
        const { visitId, paidAmount, method, isDeferred, deferredDueDate, dueDate, notes } = paymentData;
        visit.addPayment(visitId, {
          amount: Number(paidAmount || 0),
          method: method || 'cash',
          isDeferred: isDeferred || method === 'deferred',
          deferredDueDate: deferredDueDate || dueDate,
          notes: notes || '',
        });
        return `pay-${crypto.randomUUID()}`;
      },

      deletePayment: (paymentId: string) => {
        const v = visits.find(vis => (vis.payments || []).some(p => p.id === paymentId));
        if (v) {
          visit.removePayment(v.id, paymentId);
        }
      },

      markPaymentAsPaid: (visitId: string, operatorId?: string) => {
        const v = visits.find(vis => vis.id === visitId || (vis.payments || []).some(p => p.id === visitId));
        if (v) {
          const remaining = v.totalRemaining;
          if (remaining > 0) {
            visit.addPayment(v.id, {
              amount: remaining,
              method: 'cash',
              isDeferred: false,
              notes: 'تسديد الدين بالكامل'
            });
          }
        }
      },

      importData: (jsonData: string) => {
        try {
          const parsed = JSON.parse(jsonData);
          
          if (parsed.users) useUserStore.setState({ users: parsed.users });
          if (parsed.currentUser !== undefined) useAuthStore.setState({ currentUser: parsed.currentUser, isAuth: !!parsed.currentUser });
          if (parsed.activityLog) useActivityLogStore.setState({ logs: parsed.activityLog });
          if (parsed.logs) useActivityLogStore.setState({ logs: parsed.logs });
          if (parsed.customers || parsed.cars) useCustomerStore.setState({ customers: parsed.customers || [], cars: parsed.cars || [], customerDocuments: parsed.customerDocuments || [] });
          if (parsed.categories || parsed.services) useServiceStore.setState({ categories: parsed.categories || parsed.serviceCategories || [], services: parsed.services || [] });
          if (parsed.visits) useVisitStore.setState({ visits: parsed.visits || [] });
          if (parsed.settings) useSettingsStore.getState().updateSettings(parsed.settings);
          if (parsed.warrantyTemplates) useSettingsStore.setState({ warrantyTemplates: parsed.warrantyTemplates });
          if (parsed.invoiceSettings) useInvoiceSettingsStore.setState({ invoiceSettings: parsed.invoiceSettings });
          if (parsed.notifications) useNotificationStore.setState({ notifications: parsed.notifications });

          return { success: true };
        } catch (e: any) {
          return { success: false, error: `فشل الاستيراد: ${e.message}` };
        }
      }
    };
  }, [auth, customer, service, visit, settings, invoiceSettings, notifications]);

  if (selector) {
    return selector(merged);
  }
  return merged;
}

// Static useStore.getState method
useStore.getState = () => {
  const auth = useAuthStore.getState();
  const userStore = useUserStore.getState();
  const activityLog = useActivityLogStore.getState();
  const customer = useCustomerStore.getState();
  const service = useServiceStore.getState();
  const visit = useVisitStore.getState();
  const settings = useSettingsStore.getState();
  const invoiceSettings = useInvoiceSettingsStore.getState();
  const notifications = useNotificationStore.getState();
  const inspection = useInspectionStore.getState();

  const legacySettings = {
    centerName: settings.invoice?.centerName || '',
    tagline: settings.invoice?.tagline || '',
    phone: settings.invoice?.phone || '',
    email: settings.invoice?.email || '',
    address: settings.invoice?.address || '',
    website: settings.invoice?.website || '',
    commercialReg: settings.invoice?.commercialReg || '',
    taxNumber: settings.invoice?.taxNumber || '',
    workingHours: convertWorkingHoursObjToArray(settings.workingHours),
    holidays: settings.holidays || [],
    currency: settings.currency || 'IQD',
    taxRate: settings.taxRate || 0,
    paymentMethods: settings.paymentMethods || {},
    maxDeferredDays: settings.maxDeferredDays || 30,
    defaultPaperSize: settings.invoice?.paperSize || 'A4',
    printMargins: settings.invoice?.printMargins || 12,
    autoPrintOnComplete: settings.invoice?.autoPrint || false,
    defaultPrintCopies: settings.invoice?.printCopies || 1,
  };

  const visits = visit.visits || [];
  const serviceCategories = service.categories || [];
  const services = (service.services || []).map(s => ({
    ...s,
    price: s.defaultPrice,
    status: s.isActive ? 'active' : 'inactive',
    linkedFields: {
      requiresBrand: s.requiresBrand,
      requiresViscosity: s.requiresViscosity,
      requiresLiters: s.requiresLiters,
      requiresNextOdometer: s.requiresNextOdometer,
      requiresNextDate: s.requiresNextDate,
      requiresFlushType: s.requiresFlushType,
      requiresDOT: s.requiresDOT,
      requiresAxle: s.requiresAxle,
    },
    brandsForCategory: s.brands || [],
    nextIntervalKm: s.defaultIntervalKm,
    nextIntervalDays: s.defaultIntervalDays,
    oilSubtype: s.subcategoryId === 'sub-engine' || s.subcategoryId === 'sub1_1' ? 'engine' :
                s.subcategoryId === 'sub-brake' || s.subcategoryId === 'sub1_2' ? 'brake' :
                s.subcategoryId === 'sub-diff' || s.subcategoryId === 'sub1_3' ? 'differential' :
                s.subcategoryId === 'sub-steering' || s.subcategoryId === 'sub1_4' ? 'steering' :
                s.subcategoryId === 'sub-gear' || s.subcategoryId === 'sub1_5' ? 'transmission' :
                s.subcategoryId === 'sub-coolant' || s.subcategoryId === 'sub1_6' ? 'coolant' : null,
  }));

  const derivedVisitServices = visits.flatMap(v => (v.services || []).map(s => ({
    ...s,
    visitId: v.id
  })));

  const derivedInvoices = visits.filter(v => v.invoiceIssued).map(v => ({
    id: `inv-${v.id}`,
    visitId: v.id,
    invoiceNumber: v.invoiceNumber || `INV-${v.id}`,
    subtotal: v.subtotal || 0,
    discount: v.discountValue || 0,
    discountAmount: v.discountAmount || 0,
    discountType: v.discountType === 'percent' ? 'percent' : 'flat',
    tax: v.taxRate || 0,
    taxAmount: v.taxAmount || 0,
    total: v.total || 0,
    issuedAt: v.createdAt,
    paymentStatus: v.paymentStatus,
  }));

  const derivedPayments = visits.flatMap(v => (v.payments || []).map(p => ({
    id: p.id,
    visitId: v.id,
    invoiceId: `inv-${v.id}`,
    customerId: v.customerId,
    status: v.paymentStatus === 'paid' ? 'paid' : v.paymentStatus === 'partial' ? 'partial' : 'unpaid',
    totalAmount: v.total,
    paidAmount: p.amount,
    remainingAmount: v.totalRemaining,
    dueDate: p.deferredDueDate || v.exitDate || '',
    method: p.method,
    amount: p.amount,
    notes: p.notes,
    paidAt: p.paidAt,
  })));

  return {
    ...auth,
    ...userStore,
    ...activityLog,
    ...customer,
    ...service,
    ...visit,
    ...settings,
    ...invoiceSettings,
    ...notifications,
    ...inspection,
    serviceCategories,
    services,
    visitServices: derivedVisitServices,
    invoices: derivedInvoices,
    payments: derivedPayments,
    settings: legacySettings,
    invoiceSettings: settings.invoice,
    updateInvoiceSettings: settings.updateInvoice,

    // Compatibility wrappers
    addVisit: (visitData: any) => {
      const newVisit = visit.addVisit(visitData);
      return newVisit.id;
    },

    addVisitService: (vs: any) => {
      const { visitId, ...serviceFields } = vs;
      visit.addServiceToVisit(visitId, serviceFields);
    },

    removeVisitService: (serviceId: string) => {
      const v = visits.find(vis => (vis.services || []).some(s => s.id === serviceId));
      if (v) {
        visit.removeServiceFromVisit(v.id, serviceId);
      }
    },

    updateVisitService: (serviceId: string, updates: any) => {
      const v = visits.find(vis => (vis.services || []).some(s => s.id === serviceId));
      if (v) {
        useVisitStore.setState((s) => ({
          visits: s.visits.map((vis) => {
            if (vis.id !== v.id) return vis;
            const updatedServices = vis.services.map(srv => {
              if (srv.id === serviceId) {
                const merged = { ...srv, ...updates };
                merged.totalPrice = Number(merged.qty || 0) * Number(merged.unitPrice || 0);
                return merged;
              }
              return srv;
            });
            return {
              ...vis,
              services: updatedServices,
              updatedAt: new Date().toISOString()
            };
          })
        }));
        visit.recalculateVisit(v.id);
      }
    },

    generateInvoice: (visitId: string, invoiceData: any) => {
      const v = visits.find(vis => vis.id === visitId);
      if (v) {
        const invoiceNumber = v.invoiceNumber || `INV-${visitId.replace('vis-', '')}`;
        visit.updateVisit(visitId, {
          invoiceIssued: true,
          invoiceNumber,
          discountType: invoiceData.discountType || 'amount',
          discountValue: invoiceData.discountValue || 0,
          taxRate: invoiceData.taxRate || 0,
        });
        visit.recalculateVisit(visitId);
        return `inv-${visitId}`;
      }
      return `inv-${visitId}`;
    },

    addPayment: (paymentData: any) => {
      const { visitId, paidAmount, method, isDeferred, deferredDueDate, dueDate, notes } = paymentData;
      visit.addPayment(visitId, {
        amount: Number(paidAmount || 0),
        method: method || 'cash',
        isDeferred: isDeferred || method === 'deferred',
        deferredDueDate: deferredDueDate || dueDate,
        notes: notes || '',
      });
      return `pay-${crypto.randomUUID()}`;
    },

    deletePayment: (paymentId: string) => {
      const v = visits.find(vis => (vis.payments || []).some(p => p.id === paymentId));
      if (v) {
        visit.removePayment(v.id, paymentId);
      }
    },

    markPaymentAsPaid: (visitId: string, operatorId?: string) => {
      const v = visits.find(vis => vis.id === visitId || (vis.payments || []).some(p => p.id === visitId));
      if (v) {
        const remaining = v.totalRemaining;
        if (remaining > 0) {
          visit.addPayment(v.id, {
            amount: remaining,
            method: 'cash',
            isDeferred: false,
            notes: 'تسديد الدين بالكامل'
          });
        }
      }
    },

    importData: (jsonData: string) => {
      try {
        const parsed = JSON.parse(jsonData);
        
        if (parsed.users) useUserStore.setState({ users: parsed.users });
        if (parsed.currentUser !== undefined) useAuthStore.setState({ currentUser: parsed.currentUser, isAuth: !!parsed.currentUser });
        if (parsed.activityLog) useActivityLogStore.setState({ logs: parsed.activityLog });
        if (parsed.logs) useActivityLogStore.setState({ logs: parsed.logs });
        if (parsed.customers || parsed.cars) useCustomerStore.setState({ customers: parsed.customers || [], cars: parsed.cars || [], customerDocuments: parsed.customerDocuments || [] });
        if (parsed.categories || parsed.services) useServiceStore.setState({ categories: parsed.categories || parsed.serviceCategories || [], services: parsed.services || [] });
        if (parsed.visits) useVisitStore.setState({ visits: parsed.visits || [] });
        if (parsed.settings) useSettingsStore.getState().updateSettings(parsed.settings);
        if (parsed.warrantyTemplates) useSettingsStore.setState({ warrantyTemplates: parsed.warrantyTemplates });
        if (parsed.invoiceSettings) useInvoiceSettingsStore.setState({ invoiceSettings: parsed.invoiceSettings });
        if (parsed.notifications) useNotificationStore.setState({ notifications: parsed.notifications });

        return { success: true };
      } catch (e: any) {
        return { success: false, error: `فشل الاستيراد: ${e.message}` };
      }
    }
  };
};

// Re-export other hooks directly for developers who prefer importing domain hooks
export {
  useAuthStore,
  useCustomerStore,
  useServiceStore,
  useVisitStore,
  useInvoiceSettingsStore,
  useNotificationStore,
  useSettingsStore,
  useInspectionStore
};
