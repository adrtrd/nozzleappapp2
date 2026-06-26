import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car as CarIcon, 
  Calendar, 
  Wrench, 
  ClipboardList, 
  Plus, 
  Minus,
  Trash2, 
  ChevronLeft,
  AlertTriangle,
  Receipt,
  Printer,
  Download,
  CheckCircle,
  Clock,
  Ban,
  Tag,
  Coins,
  ShieldCheck,
  X,
  FileText,
  Copy,
  Check,
  CreditCard,
  Building,
  UserCheck,
  Palette,
  Hash,
  Compass,
  Droplet,
  Filter,
  ShieldAlert,
  Wind,
  Zap,
  Disc,
  Search,
  PlusCircle,
  Star,
  User,
  Send,
  Camera,
  Activity,
  Smile,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  useStore, 
  VisitStatus, 
  PaymentMethod, 
  PaymentStatus, 
  VisitService, 
  Service, 
  Payment,
  Visit,
  Customer,
  Car,
  User as StoreUser,
  Invoice,
  ServiceCategory,
  useVisitStore
} from '../store/store';
import { toast } from '../store/toastStore';
import { formatDate, formatCurrency } from './Dashboard';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { InvoicePrintView } from '../components/InvoicePrintView';
import { usePrintStore } from '../components/PrintProvider';
import { convertNumberToInvoiceArabicWords } from '../utils/numberToWords';
import { openWhatsApp, buildInvoiceMessage, buildDebtReminderMessage, buildWelcomeMessage } from '../utils/whatsapp';
import { Lock, Unlock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const ViscosityOptions = ['0W-20', '0W-40', '5W-30', '5W-40', '10W-30', '10W-40', '15W-40', '20W-50'];
const PredefinedOilBrands = ['Castrol', 'Mobil', 'Shell', 'Total', 'Valvoline', 'Liqui Moly', 'Pennzoil', 'Motul', 'Havoline', 'Gulf'];
const KANBAN_STATUSES: VisitStatus[] = ['منتظر', 'استقبلت', 'قيد الفحص', 'قيد التنفيذ', 'انتهت', 'سُلّمت'];

const VisitDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Store States & Actions
  const visits = useStore((state) => state.visits);
  const customers = useStore((state) => state.customers);
  const cars = useStore((state) => state.cars);
  const users = useStore((state) => state.users);
  const services = useStore((state) => state.services);
  const visitServices = useStore((state) => state.visitServices);
  const invoices = useStore((state) => state.invoices);
  const payments = useStore((state) => state.payments);
  const settings = useStore((state) => state.settings);
  const serviceCategories = useStore((state) => state.serviceCategories);
  const invoiceSettings = useStore((state) => state.invoiceSettings);
  const triggerPrint = usePrintStore((s) => s.triggerPrint);
  const currentUser = useAuthStore((s) => s.currentUser);
  const unlockVisit = useVisitStore((s) => s.unlockVisit);

  const updateVisit = useStore((state) => state.updateVisit);
  const addVisitService = useStore((state) => state.addVisitService);
  const removeVisitService = useStore((state) => state.removeVisitService);
  const updateVisitService = useStore((state) => state.updateVisitService);
  const generateInvoice = useStore((state) => state.generateInvoice);
  const addPayment = useStore((state) => state.addPayment);
  const deletePayment = useStore((state) => state.deletePayment);
  const markPaymentAsPaid = useStore((state) => state.markPaymentAsPaid);

  const visit = visits.find((v: Visit) => v.id === id);
  const customer = visit ? customers.find((c: Customer) => c.id === visit.customerId) : null;
  const car = visit ? cars.find((c: Car) => c.id === visit.carId) : null;
  const technician = visit ? users.find((u: StoreUser) => u.id === visit.technicianId) : null;
  const currentVisitServices = visitServices.filter((vs: VisitService) => vs.visitId === id);
  const invoice = invoices.find((inv: Invoice) => inv.visitId === id);
  const payment = payments.find((p: Payment) => p.visitId === id);

  const getCustomerDebts = (customerId: string) => {
    return payments
      .filter((p: Payment) => p.customerId === customerId && p.status !== 'paid')
      .reduce((sum: number, p: Payment) => sum + (p.remainingAmount || 0), 0);
  };

  // States
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  const [copiedInvoiceNumber, setCopiedInvoiceNumber] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'photos' | 'logs'>('services');

  // Split view details toggle
  const [isReceptionDetailsOpen, setIsReceptionDetailsOpen] = useState(true);

  // Note dialog state per service row
  const [editingNotesVsId, setEditingNotesVsId] = useState<string | null>(null);
  const [tempRowNotes, setTempRowNotes] = useState('');

  // Service Drawer wizard states
  const [drawerStep, setDrawerStep] = useState(1); // 1: Choose Category, 2: Select Service, 3: Details form
  const [drawerSearch, setDrawerSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [isCustomService, setIsCustomService] = useState(false);
  const [customServiceName, setCustomServiceName] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('أخرى');

  // Detailed parameters for step 3
  const [oilBrand, setOilBrand] = useState('Castrol');
  const [oilProductName, setOilProductName] = useState('');
  const [oilViscosity, setOilViscosity] = useState('5W-30');
  const [oilLiters, setOilLiters] = useState<number>(4);
  const [oilPricePerLiter, setOilPricePerLiter] = useState<number>(10000);
  const [oilType, setOilType] = useState('Fully Synthetic');
  const [oilDotGrade, setOilDotGrade] = useState('DOT 4');
  const [oilAxle, setOilAxle] = useState('Both');
  const [oilTransType, setOilTransType] = useState('Automatic');
  const [oilFlushType, setOilFlushType] = useState('Drain & Fill');
  const [oilColor, setOilColor] = useState('Red');
  const [oilConcentration, setOilConcentration] = useState('50%');
  const [oilInterval, setOilInterval] = useState<number>(5000);
  const [oilNextDate, setOilNextDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });

  // AC Custom details
  const [acRefrigerantType, setAcRefrigerantType] = useState('R134a');
  const [acPressureBefore, setAcPressureBefore] = useState('30 PSI');
  const [acPressureAfter, setAcPressureAfter] = useState('45 PSI');

  // Service Drawer quantity/pricing
  const [drawerQty, setDrawerQty] = useState(1);
  const [drawerUnitPrice, setDrawerUnitPrice] = useState(0);
  const [drawerNotes, setDrawerNotes] = useState('');

  // Custom brand additions inside drawer
  const [showAddBrandInput, setShowAddBrandInput] = useState(false);
  const [customOilBrand, setCustomOilBrand] = useState('');
  const [customBrandsList, setCustomBrandsList] = useState<string[]>([]);

  // Billing calculation states
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [taxEnabled, setTaxEnabled] = useState(false);

  const isOilCategory = selectedCategoryId === 'cat1' || 
    (serviceCategories.find((c: ServiceCategory) => c.id === selectedCategoryId)?.name || '').includes('الزيوت');

  // Close Visit modal states
  const [isCloseVisitOpen, setIsCloseVisitOpen] = useState(false);
  const [exitOdometer, setExitOdometer] = useState<number>(0);
  const [exitDate, setExitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [closingNotes, setClosingNotes] = useState('');
  const [internalRating, setInternalRating] = useState(5);

  // Close Visit Payments States
  const [closePaymentMethod, setClosePaymentMethod] = useState<PaymentMethod>('cash');
  const [closePaidAmount, setClosePaidAmount] = useState<number>(0);
  const [closeDeferredDueDate, setCloseDeferredDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [closeDeferredGuarantor, setCloseDeferredGuarantor] = useState('');
  const [closePlatform, setClosePlatform] = useState('ZainCash');
  const [closeReceiptNumber, setCloseReceiptNumber] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  // Success screen
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(3);
  const [newlyCreatedInvoiceId, setNewlyCreatedInvoiceId] = useState('');
  const [closedInvoiceNumber, setClosedInvoiceNumber] = useState('');

  const primaryButtonStyle = {
    background: 'var(--color-brand-primary, #6366f1)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const secondaryButtonStyle = {
    background: 'var(--color-background-secondary, #f1f5f9)',
    color: 'var(--color-text-secondary, #475569)',
    border: '1px solid var(--color-border-primary, #e2e8f0)',
    borderRadius: '10px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  // Calculations
  const subtotal = currentVisitServices.reduce((sum: number, item: VisitService) => sum + (item.unitPrice * item.qty), 0);
  const discountAmount = discountType === 'flat' ? discountValue : (subtotal * discountValue) / 100;
  const taxRate = taxEnabled ? (settings.taxRate || 5) : 0;
  const taxAmount = ((subtotal - discountAmount) * taxRate) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  // Init exit odometer from entry odometer
  useEffect(() => {
    if (visit) {
      setExitOdometer(visit.entryOdometer);
    }
  }, [visit]);

  // Load existing invoice inputs if already generated
  useEffect(() => {
    if (invoice) {
      setDiscountValue(invoice.discount);
      setDiscountType(invoice.discountType);
      setTaxEnabled((invoice.tax || 0) > 0);
    }
  }, [invoice]);

  // Autofill paid amount when grand total or method changes
  useEffect(() => {
    if (visit?.invoiceIssued) {
      setClosePaidAmount(0);
    } else {
      if (closePaymentMethod === 'deferred') {
        setClosePaidAmount(0);
      } else {
        setClosePaidAmount(grandTotal);
      }
    }
  }, [closePaymentMethod, grandTotal, visit?.invoiceIssued]);

  // Countdown handler for success screen
  useEffect(() => {
    let timer: any;
    if (showSuccessScreen && successCountdown > 0) {
      timer = setTimeout(() => {
        setSuccessCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [showSuccessScreen, successCountdown]);

  const handlePrint = () => {
    if (!visit || !customer) return;
    triggerPrint({
      visit,
      customer,
      car,
      services: currentVisitServices,
      invoice: invoice || invoices.find((inv: Invoice) => inv.visitId === visit.id) || {
        invoiceNumber: visit.invoiceNumber || 'INV-DRAFT',
        paymentStatus: payment?.status || 'unpaid',
        paymentMethod: payment?.method || '',
        subtotal,
        discountAmount,
        taxRate,
        taxAmount,
        total: grandTotal,
        totalPaid: payment?.paidAmount || 0,
        totalRemaining: payment?.remainingAmount || 0,
        dueDate: payment?.dueDate || '',
      },
      settings: invoiceSettings,
    });
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-print-view');
    if (!element) {
      toast.error('لم يتم العثور على الفاتورة');
      return;
    }

    const wrapper = document.getElementById('invoice-print-wrapper');
    if (!wrapper) return;

    setIsGeneratingPDF(true);

    const originalTop = wrapper.style.top;
    const originalLeft = wrapper.style.left;
    wrapper.style.top = '0px';
    wrapper.style.left = '0px';
    wrapper.style.position = 'fixed';
    wrapper.style.zIndex = '99999';

    // Wait for fonts to load
    await document.fonts.ready;
    // Extra wait for images/logo
    await new Promise(r => setTimeout(r, 500));

    const opt = {
      margin:     [12, 15, 12, 15],
      filename:   `فاتورة-${invoice?.invoiceNumber || 'INV'}.pdf`,
      image:      { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale:           2,
        useCORS:         true,
        allowTaint:      true,
        letterRendering: true,
        scrollX:         0,
        scrollY:         0,
        backgroundColor: '#ffffff',
        logging:         false,
      },
      jsPDF: {
        unit:        'mm',
        format:      'a4',
        orientation: 'portrait',
      },
    };

    try {
      const html2pdf = (window as any).html2pdf;
      if (!html2pdf) {
        throw new Error('مكتبة تصدير PDF غير متوفرة. يرجى التحقق من اتصال الإنترنت.');
      }
      await html2pdf().set(opt).from(element).save();
      toast.success('تم تحميل الفاتورة بنجاح');
    } catch (err: any) {
      console.error('PDF export error:', err);
      toast.error(err.message || 'حدث خطأ أثناء تصدير PDF');
    } finally {
      // Restore off-screen position
      wrapper.style.top = originalTop;
      wrapper.style.left = originalLeft;
      wrapper.style.position = 'fixed';
      wrapper.style.zIndex = '-1';
      setIsGeneratingPDF(false);
    }
  };

  if (!visit) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold font-cairo text-brand-text-light dark:text-brand-text-dark">الزيارة المطلوبة غير موجودة</h3>
        <button onClick={() => navigate('/visits')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold font-cairo">العودة للزيارات</button>
      </div>
    );
  }

  // Handle service details edit inside left panel
  const handleUpdateQty = (vsId: string, newQty: number) => {
    const vs = visitServices.find((v: VisitService) => v.id === vsId);
    if (!vs) return;
    const updatedQty = Math.max(0.5, newQty);
    updateVisitService(vsId, {
      qty: updatedQty,
      totalPrice: updatedQty * vs.unitPrice
    });
  };

  const handleUpdatePrice = (vsId: string, newPrice: number) => {
    const vs = visitServices.find((v: VisitService) => v.id === vsId);
    if (!vs) return;
    const updatedPrice = Math.max(0, newPrice);
    updateVisitService(vsId, {
      unitPrice: updatedPrice,
      totalPrice: vs.qty * updatedPrice
    });
  };

  const handleUpdateTechNotes = (vsId: string, text: string) => {
    updateVisitService(vsId, { notes: text });
  };

  const openRowNotesModal = (vs: VisitService) => {
    setEditingNotesVsId(vs.id);
    setTempRowNotes(vs.notes || '');
  };

  const saveRowNotes = () => {
    if (editingNotesVsId) {
      updateVisitService(editingNotesVsId, { notes: tempRowNotes });
      setEditingNotesVsId(null);
      toast.success('تم حفظ ملاحظات الخدمة بنجاح');
    }
  };

  // Move service item order (simulate drag sorting)
  const handleShiftItem = (index: number, direction: 'up' | 'down') => {
    const items = [...currentVisitServices];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    
    // Swap IDs sortOrder
    const currentItem = items[index];
    const targetItem = items[targetIdx];
    
    const tempOrder = currentItem.sortOrder || index;
    updateVisitService(currentItem.id, { sortOrder: targetItem.sortOrder || targetIdx });
    updateVisitService(targetItem.id, { sortOrder: tempOrder });
    toast.success('تمت إعادة ترتيب العناصر');
  };

  // Submit new service from Drawer
  const handleDrawerServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = '';
    let isOilCategoryLocal = selectedCategoryId === 'cat1' || 
      serviceCategories.find((c: ServiceCategory) => c.id === selectedCategoryId)?.name.includes('الزيوت');
    let isACCategory = selectedCategoryId === 'cat3' || 
      serviceCategories.find((c: ServiceCategory) => c.id === selectedCategoryId)?.name.includes('التكييف') || 
      serviceCategories.find((c: ServiceCategory) => c.id === selectedCategoryId)?.name.includes('AC');

    let oilDetails: any = null;
    let qty = drawerQty;
    let unitPrice = drawerUnitPrice;
    let unit: 'liter' | 'piece' | 'service' = 'service';

    if (isOilCategoryLocal) {
      qty = oilLiters;
      unitPrice = oilPricePerLiter;
      unit = 'liter';

      // Odometer calculations
      const currentOdo = visit.entryOdometer;
      const nextOdo = currentOdo + oilInterval;

      oilDetails = {
        brand: oilBrand,
        productName: oilProductName,
        viscosity: oilViscosity,
        litersUsed: oilLiters,
        pricePerLiter: oilPricePerLiter,
        oilType,
        dotGrade: oilDotGrade,
        axle: oilAxle,
        transmissionType: oilTransType,
        flushType: oilFlushType,
        color: oilColor,
        concentration: oilConcentration,
        currentOdometer: currentOdo,
        nextChangeOdometer: nextOdo,
        nextChangeIntervalKm: oilInterval,
        nextChangeDate: oilNextDate,
        notes: drawerNotes
      };
    } else if (isACCategory) {
      oilDetails = {
        refrigerantType: acRefrigerantType,
        pressureBefore: acPressureBefore,
        pressureAfter: acPressureAfter,
        notes: drawerNotes
      };
    }

    if (isCustomService) {
      finalName = customServiceName;
    } else {
      const selected = services.find((s: Service) => s.id === selectedServiceId);
      finalName = selected?.name || 'خدمة صيانة مضافة';
    }

    if (!finalName) {
      toast.error('يرجى تحديد اسم الخدمة');
      return;
    }

    const cName = serviceCategories.find((c: ServiceCategory) => c.id === selectedCategoryId)?.name || customCategoryName;

    addVisitService({
      visitId: visit.id,
      serviceId: isCustomService ? 'custom' : selectedServiceId,
      serviceName: finalName,
      categoryName: cName,
      qty,
      unit,
      unitPrice,
      totalPrice: qty * unitPrice,
      notes: drawerNotes,
      oilDetails,
      categoryId: selectedCategoryId,
      sortOrder: currentVisitServices.length
    });

    toast.success('تمت إضافة الخدمة للزيارة بنجاح');
    setIsAddServiceOpen(false);
    resetDrawerState();
  };

  const resetDrawerState = () => {
    setDrawerStep(1);
    setDrawerSearch('');
    setSelectedCategoryId('');
    setSelectedServiceId('');
    setIsCustomService(false);
    setCustomServiceName('');
    setDrawerQty(1);
    setDrawerUnitPrice(0);
    setDrawerNotes('');
    setOilBrand('Castrol');
    setOilProductName('');
    setOilViscosity('5W-30');
    setOilLiters(4);
    setOilPricePerLiter(10000);
    setOilType('Fully Synthetic');
    setAcRefrigerantType('R134a');
    setAcPressureBefore('30 PSI');
    setAcPressureAfter('45 PSI');
  };

  // Close Visit final submission with validation checks
  const handleCloseVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!visit) return;

    // 1. Validation warnings checks
    if (exitOdometer < visit.entryOdometer) {
      toast.error(`خطأ: عداد الخروج (${exitOdometer.toLocaleString('ar-IQ')} كم) يجب أن يكون مساوياً أو أكبر من عداد الدخول (${visit.entryOdometer.toLocaleString('ar-IQ')} كم)`);
      return;
    }

    if (car && visit.entryOdometer < car.odometer) {
      toast.error(`خطأ: عداد دخول الزيارة (${visit.entryOdometer.toLocaleString('ar-IQ')} كم) لا يصح أن يكون أصغر من آخر عداد مسجل للسيارة (${car.odometer.toLocaleString('ar-IQ')} كم)`);
      return;
    }

    if (closePaymentMethod === 'partial' && (closePaidAmount <= 0 || closePaidAmount >= grandTotal)) {
      toast.error('لمسار الدفع الجزئي، يجب إدخال مبلغ دفع صالح أصغر من المجموع وأكبر من الصفر');
      return;
    }

    // Call store.closeVisit atomically
    const closeData = {
      exitDate,
      exitOdometer,
      notes: closingNotes,
      payment: closePaidAmount > 0 ? {
        amount: closePaidAmount,
        method: closePaymentMethod,
        isDeferred: closePaymentMethod === 'deferred',
        deferredDueDate: closePaymentMethod === 'deferred' || closePaymentMethod === 'partial' ? closeDeferredDueDate : undefined,
        notes: closeNotes,
      } : null,
    };

    const invoiceNum = useVisitStore.getState().closeVisit(visit.id, closeData);
    setClosedInvoiceNumber(invoiceNum);

    // Update Car odometer milestone
    if (car && exitOdometer > car.odometer) {
      const storeState = useStore.getState();
      storeState.updateCar(car.id, { odometer: exitOdometer });
    }

    // Transition to success screen
    setIsCloseVisitOpen(false);
    setShowSuccessScreen(true);
    toast.success('تمت صيانة وإغلاق كرت الزيارة بنجاح');
  };

  // WhatsApp template generator
  const handleSendWhatsAppNotification = (notificationType: 'welcome' | 'completed' | 'debt') => {
    if (!customer || !car) return;
    let text = '';
    if (notificationType === 'welcome') {
      text = buildWelcomeMessage({
        customerName: customer.name,
        carBrand: car.brand,
        carName: car.name,
        plateNumber: car.plateNumber,
        visitId: visit.id,
      });
    } else if (notificationType === 'completed') {
      text = buildInvoiceMessage({
        customerName: customer.name,
        carBrand: car.brand,
        carName: car.name,
        plateNumber: car.plateNumber,
        total: grandTotal,
        invoiceNumber: invoice?.invoiceNumber,
      });
    } else if (notificationType === 'debt') {
      const debtVal = payment ? payment.remainingAmount : grandTotal - closePaidAmount;
      text = buildDebtReminderMessage({
        customerName: customer.name,
        carBrand: car.brand,
        carName: car.name,
        remainingAmount: debtVal,
        dueDate: payment?.dueDate || closeDeferredDueDate,
      });
    }
    openWhatsApp(customer.phone, text);
  };

  const handleConfirmUnlock = () => {
    if (!visit || !unlockReason.trim()) return;
    const success = unlockVisit(visit.id, `فك قفل الزيارة: ${unlockReason}`);
    if (success) {
      setShowUnlockModal(false);
      setUnlockReason('');
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    if (cat.includes('الزيوت')) return 'border-amber-500';
    if (cat.includes('الفرامل')) return 'border-red-500';
    if (cat.includes('التكييف') || cat.includes('AC')) return 'border-sky-500';
    if (cat.includes('الفلاتر')) return 'border-emerald-500';
    if (cat.includes('الكهرباء')) return 'border-purple-500';
    return 'border-slate-300';
  };

  return (
    <div className="space-y-6 font-cairo">
      
      {/* Visit Lock Banner */}
      {visit && visit.isLocked && (
        <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-cairo">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">
                هذه الزيارة مغلقة ومقفلة
              </h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
                تم إقفالها بواسطة <span className="font-semibold">{visit.lockedBy || 'النظام'}</span> في {visit.lockedAt ? formatDate(visit.lockedAt) : ''}
                {visit.lockReason && ` (السبب: ${visit.lockReason})`}
              </p>
            </div>
          </div>
          
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowUnlockModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/10 active:scale-95 transition-all"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>فك قفل الزيارة</span>
            </button>
          )}
        </div>
      )}

      {/* Top Navigation Bar & Status Log Dropdown */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/visits')}
            className="p-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark hover:bg-slate-50 dark:hover:bg-slate-800 text-brand-text-light dark:text-brand-text-dark transition-all"
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h2 className="text-base font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
              كرت صيانة زيارة رقم: #{visit.id.substring(0, 8).toUpperCase()}
            </h2>
            <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark">
              تاريخ الدخول: {formatDate(visit.entryDate)}
            </p>
          </div>
        </div>

        {/* Status Dropdown Indicator */}
        <div className="flex items-center gap-2 mr-auto" onClick={e => e.stopPropagation()}>
          <span className="text-xs text-brand-muted-light font-bold">الحالة:</span>
          <select
            value={visit.status}
            disabled={visit.isLocked || visit.status === 'Completed' || visit.status === 'Cancelled' || visit.status === 'delivered'}
            onChange={(e) => {
              const st = e.target.value as VisitStatus;
              updateVisit(visit.id, { status: st });
              toast.success(`تم نقل حالة الزيارة إلى: ${st}`);
            }}
            className="px-3 py-1.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-brand-bg-dark text-xs font-bold text-brand-text-light dark:text-brand-text-dark focus:outline-none"
          >
            {KANBAN_STATUSES.map((st: VisitStatus) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split Layout: 65% Left Panel, 35% Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-100 gap-6 items-start">
        
        {/* Left Pane (65% width) - Services & Custom Items */}
        <div className="lg:col-span-65 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-3xl shadow-sm space-y-6 relative">
          {visit && visit.isLocked && (
            <div 
              style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'not-allowed' }} 
              onClick={() => toast.error('الزيارة مقفلة')} 
            />
          )}
          <div className="flex justify-between items-center border-b border-brand-border-light dark:border-brand-border-dark pb-4">
            <h3 className="text-sm font-bold text-brand-text-light dark:text-brand-text-dark flex items-center gap-2">
              <Wrench className="w-4.5 h-4.5 text-indigo-500" />
              قائمة الفحوصات والصيانة المطلوبة
            </h3>
            
            {visit.status !== 'Completed' && visit.status !== 'Cancelled' && (
              <button
                onClick={() => {
                  setDrawerStep(1);
                  setIsAddServiceOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة خدمة / قطعة</span>
              </button>
            )}
          </div>

          {currentVisitServices.length > 0 ? (
            <div className="space-y-3">
              {currentVisitServices
                .sort((a: VisitService, b: VisitService) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .map((vs: VisitService, idx: number) => (
                  <div 
                    key={vs.id}
                    className={`border-r-4 ${getCategoryBadgeClass(vs.categoryName)} bg-slate-50/50 dark:bg-brand-bg-dark/20 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-sm`}
                  >
                    {/* Shift items sorting handles */}
                    {visit.status !== 'Completed' && visit.status !== 'Cancelled' && (
                      <div className="flex flex-col gap-1 text-brand-muted-light">
                        <button 
                          disabled={idx === 0} 
                          onClick={() => handleShiftItem(idx, 'up')}
                          className="hover:text-brand-text-light disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button 
                          disabled={idx === currentVisitServices.length - 1} 
                          onClick={() => handleShiftItem(idx, 'down')}
                          className="hover:text-brand-text-light disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <h4 className="font-bold text-xs text-brand-text-light dark:text-brand-text-dark">{vs.serviceName}</h4>
                      <p className="text-[10px] text-brand-muted-light">{vs.categoryName}</p>
                      
                      {/* Oil fields logs */}
                      {vs.oilDetails && (
                        <div className="text-[10px] text-indigo-600 dark:text-brand-accent-light bg-indigo-50/30 p-2 rounded-lg mt-1 space-y-0.5">
                          <p>الماركة: {vs.oilDetails.brand} | اللزوجة: {vs.oilDetails.viscosity}</p>
                          {vs.oilDetails.nextChangeOdometer && (
                            <p className="font-bold">الموعد القادم: {vs.oilDetails.nextChangeOdometer.toLocaleString('ar-IQ')} كم ({(vs.oilDetails.nextChangeIntervalKm || 5000).toLocaleString('ar-IQ')} كم)</p>
                          )}
                        </div>
                      )}

                      {/* AC logs details */}
                      {vs.oilDetails?.refrigerantType && (
                        <div className="text-[10px] text-sky-600 dark:text-sky-400 bg-sky-50/30 p-2 rounded-lg mt-1">
                          نوع الغاز: {vs.oilDetails.refrigerantType} | الضغط قبل: {vs.oilDetails.pressureBefore} | الضغط بعد: {vs.oilDetails.pressureAfter}
                        </div>
                      )}
                    </div>

                    {/* Inline Quantities & Price Editor */}
                    <div className="flex items-center gap-3">
                      
                      {/* Qty field */}
                      <div className="flex items-center border border-brand-border-light rounded-lg bg-white dark:bg-brand-surface-dark p-0.5">
                        <button
                          disabled={visit.status === 'Completed' || visit.status === 'Cancelled'}
                          onClick={() => handleUpdateQty(vs.id, vs.qty - 1)}
                          className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-bold text-xs">{vs.qty}</span>
                        <button
                          disabled={visit.status === 'Completed' || visit.status === 'Cancelled'}
                          onClick={() => handleUpdateQty(vs.id, vs.qty + 1)}
                          className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Price field */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          disabled={visit.status === 'Completed' || visit.status === 'Cancelled'}
                          value={vs.unitPrice}
                          onChange={(e) => handleUpdatePrice(vs.id, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-brand-border-light rounded-lg text-xs font-bold text-right"
                        />
                        <span className="text-[10px] text-brand-muted-light font-bold">د.ع</span>
                      </div>

                      {/* Row total */}
                      <div className="w-24 text-left font-bold text-xs text-brand-text-light dark:text-brand-text-dark">
                        {vs.totalPrice.toLocaleString('ar-IQ')} د.ع
                      </div>
                    </div>

                    {/* Row Notes button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openRowNotesModal(vs)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-brand-muted-light text-xs font-cairo"
                      >
                        ملاحظات الفني
                      </button>
                      {visit.status !== 'Completed' && visit.status !== 'Cancelled' && (
                        <button
                          onClick={() => {
                            removeVisitService(vs.id);
                            toast.success('تمت إزالة الخدمة');
                          }}
                          className="p-1.5 text-brand-muted-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>
                ))}
            </div>
          ) : (
            <EmptyState
              title="لا توجد خدمات مضافة للزيارة"
              description="يرجى إضافة قطع غيار أو خدمات فحص صيانة لكرت الزيارة لبدء عملية الصيانة"
              actionLabel="إضافة خدمات"
              onAction={() => setIsAddServiceOpen(true)}
              icon={<Wrench className="w-8 h-8" />}
            />
          )}

        </div>

        {/* Right Pane (35% width) - Reception Details & Payments */}
        <div className="lg:col-span-35 space-y-6">
          
          {/* Collapsible Reception details */}
          <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-5 rounded-3xl shadow-sm space-y-4">
            <div 
              onClick={() => setIsReceptionDetailsOpen(!isReceptionDetailsOpen)}
              className="flex justify-between items-center cursor-pointer border-b border-slate-100 pb-2"
            >
              <h4 className="font-bold text-xs text-brand-text-light dark:text-brand-text-dark font-cairo flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                بيانات الدخول وتوثيق الاستلام
              </h4>
              <button className="text-brand-muted-light">
                {isReceptionDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isReceptionDetailsOpen && (
              <div className="space-y-3 text-xs leading-relaxed">
                {customer && (
                  <div className="bg-slate-50 dark:bg-brand-bg-dark/40 p-3 rounded-xl">
                    <p className="font-bold text-brand-text-light">{customer.name}</p>
                    <p className="text-brand-muted-light mt-0.5">{customer.phone}</p>
                    {getCustomerDebts(customer.id) > 0 && (
                      <p className="text-red-600 font-extrabold mt-1">⚠️ ديون سابقة معلقة: {getCustomerDebts(customer.id).toLocaleString('ar-IQ')} د.ع</p>
                    )}
                  </div>
                )}

                {car && (
                  <div className="space-y-1">
                    <p className="text-brand-text-light"><strong>المركبة:</strong> {car.brand} {car.name} ({car.year})</p>
                    <p className="text-brand-text-light"><strong>لوحة الترخيص:</strong> {car.plateNumber}</p>
                    <p className="text-brand-text-light"><strong>عداد دخول الصيانة:</strong> {visit.entryOdometer.toLocaleString('ar-IQ')} كم</p>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-2 space-y-1">
                  <p className="text-brand-text-light"><strong>شكوى العميل:</strong> {visit.customerComplaint || 'لا توجد شكاوى مسجلة.'}</p>
                  <p className="text-brand-text-light"><strong>التشخيص الأولي:</strong> {visit.receptionNotes || 'لا توجد ملاحظات.'}</p>
                </div>

                {visit.receptionPhotos && visit.receptionPhotos.length > 0 && (
                  <div className="border-t border-slate-100 pt-2">
                    <span className="font-bold text-brand-text-light block mb-1.5">صور توثيق الاستلام:</span>
                    <div className="flex gap-2 overflow-x-auto">
                      {visit.receptionPhotos.map((photo: { url: string; uploadedAt: string }, index: number) => (
                        <img key={index} src={photo.url} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing & Live Invoice calculations */}
          <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-3xl shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-brand-text-light dark:text-brand-text-dark font-cairo pb-2 border-b">
              ملخص الحساب المالي للفاتورة
            </h4>

            <div className="space-y-2.5 text-xs text-brand-text-light dark:text-brand-text-dark">
              <div className="flex justify-between">
                <span>مجموع الخدمات والقطع:</span>
                <span className="font-bold">{subtotal.toLocaleString('ar-IQ')} د.ع</span>
              </div>

              {/* Discount inputs */}
              {!invoice && visit && !visit.isLocked && (
                <div className="grid grid-cols-2 gap-2 border-t border-b py-2">
                  <div>
                    <label className="block text-[10px] text-brand-muted-light font-bold mb-1">نوع الخصم</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full px-2 py-1 rounded border text-xs"
                    >
                      <option value="flat">مبلغ ثابت (د.ع)</option>
                      <option value="percent">نسبة مئوية (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-brand-muted-light font-bold mb-1">قيمة الخصم</label>
                    <input
                      type="number"
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border rounded text-xs text-right"
                    />
                  </div>
                </div>
              )}

              {/* Tax Toggle */}
              {!invoice && visit && !visit.isLocked && (
                <div className="flex justify-between items-center text-xs py-1 border-b">
                  <span className="text-brand-muted-light">تفعيل الضريبة ({settings.taxRate || 5}%):</span>
                  <input
                    type="checkbox"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border text-indigo-600"
                  />
                </div>
              )}

              <div className="flex justify-between text-red-600">
                <span>قيمة الخصم الممنوح:</span>
                <span className="font-bold">- {discountAmount.toLocaleString('ar-IQ')} د.ع</span>
              </div>

              <div className="flex justify-between text-indigo-600">
                <span>ضريبة المبيعات المضافة:</span>
                <span className="font-bold">+ {taxAmount.toLocaleString('ar-IQ')} د.ع</span>
              </div>

              <div className="flex justify-between text-base font-extrabold border-t pt-2 border-slate-200">
                <span>المجموع الكلي:</span>
                <span className="text-indigo-600 dark:text-brand-accent-light">{grandTotal.toLocaleString('ar-IQ')} د.ع</span>
              </div>

              {/* Arabic translation of number */}
              <div className="text-[10px] bg-slate-100 p-2.5 rounded-xl font-bold text-center text-brand-text-light font-cairo">
                {convertNumberToInvoiceArabicWords(grandTotal)}
              </div>
            </div>

            {/* Actions button */}
            <div className="space-y-2 pt-2 border-t">
              {visit.isLocked || visit.status === 'Completed' || visit.status === 'Cancelled' || visit.status === 'delivered' ? (
                <button
                  type="button"
                  onClick={() => setIsInvoiceOpen(true)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs font-cairo rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>معاينة وطباعة الفاتورة الفاخرة</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCloseVisitOpen(true)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs font-cairo rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>إغلاق الزيارة وإصدار الفاتورة</span>
                </button>
              )}

              {/* WhatsApp Notification Center */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => handleSendWhatsAppNotification('completed')}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 border text-[10px] font-bold font-cairo rounded-lg flex items-center justify-center gap-1 text-slate-700"
                >
                  <Send className="w-3 h-3 text-emerald-500" />
                  إرسال إشعار جاهزية
                </button>
                <button
                  onClick={() => handleSendWhatsAppNotification('debt')}
                  disabled={!payment || payment.remainingAmount <= 0}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 border text-[10px] font-bold font-cairo rounded-lg flex items-center justify-center gap-1 text-slate-700 disabled:opacity-40"
                >
                  <Send className="w-3 h-3 text-red-500" />
                  تذكير بالديون
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Right Side Sliding Service Drawer */}
      <AnimatePresence>
        {isAddServiceOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-start">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddServiceOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
            />
            
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-white dark:bg-brand-surface-dark h-full shadow-2xl flex flex-col z-10 text-right font-cairo"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border-light dark:border-brand-border-dark font-cairo bg-slate-50 dark:bg-slate-900/30">
                <div>
                  <h3 className="text-base font-bold text-brand-text-light dark:text-brand-text-dark">إضافة خدمة جديدة للصيانة</h3>
                  <p className="text-[10px] text-brand-muted-light mt-0.5">الخطوة {drawerStep} من أصل 3</p>
                </div>
                <button
                  onClick={() => setIsAddServiceOpen(false)}
                  className="p-1.5 rounded-lg text-brand-muted-light hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer wizard content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Step 1: Choose Category */}
                {drawerStep === 1 && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-brand-text-light">اختر تصنيف الخدمة:</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {serviceCategories.map((cat: ServiceCategory) => {
                        let IconComp = <PlusCircle className="w-6 h-6" />;
                        if (cat.id === 'cat1' || cat.name.includes('الزيوت')) IconComp = <Droplet className="w-6 h-6" />;
                        else if (cat.id === 'cat2' || cat.name.includes('الفلاتر')) IconComp = <Filter className="w-6 h-6" />;
                        else if (cat.id === 'cat3' || cat.name.includes('الفرامل')) IconComp = <Disc className="w-6 h-6" />;
                        else if (cat.id === 'cat4' || cat.name.includes('التكييف') || cat.name.includes('AC')) IconComp = <Wind className="w-6 h-6" />;
                        
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategoryId(cat.id);
                              setDrawerStep(2);
                            }}
                            className="p-5 rounded-2xl border border-brand-border-light bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-500 flex flex-col items-center gap-3 transition-all text-center group"
                          >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                              {IconComp}
                            </div>
                            <span className="font-bold text-xs text-brand-text-light font-cairo">{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Choose Service Catalog */}
                {drawerStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="font-bold text-xs text-brand-text-light">اختر الخدمة من الدليل:</h4>
                      <button 
                        onClick={() => {
                          setIsCustomService(true);
                          setCustomServiceName('');
                          setDrawerStep(3);
                        }}
                        className="text-xs text-indigo-600 hover:underline font-bold"
                      >
                        + كتابة خدمة مخصصة
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="بحث في دليل خدمات التصنيف..."
                        value={drawerSearch}
                        onChange={(e) => setDrawerSearch(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light bg-brand-surface-light text-right text-xs focus:outline-none"
                      />
                      <Search className="absolute inset-y-0 right-3 w-4 h-4 my-auto text-brand-muted-light" />
                    </div>

                    <div className="border rounded-xl divide-y bg-white max-h-80 overflow-y-auto">
                      {services
                        .filter((s: Service) => s.categoryId === selectedCategoryId && s.name.toLowerCase().includes(drawerSearch.toLowerCase()))
                        .map((s: Service) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSelectedServiceId(s.id);
                              setDrawerUnitPrice(s.defaultPrice ?? 0);
                              setIsCustomService(false);
                              setDrawerStep(3);
                            }}
                            className="p-3 text-right cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-center text-xs"
                          >
                            <span className="font-bold">{s.name}</span>
                            <span className="text-brand-muted-light font-bold">{(s.defaultPrice ?? 0).toLocaleString('ar-IQ')} د.ع</span>
                          </div>
                        ))}
                      {services.filter((s: Service) => s.categoryId === selectedCategoryId).length === 0 && (
                        <p className="p-4 text-center text-brand-muted-light text-xs">لا توجد خدمات مسبقة مضافة. اضغط بالأعلى لإضافة خدمة مخصصة.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Detailed Form fields */}
                {drawerStep === 3 && (
                  <div className="space-y-5">
                    <h4 className="font-bold text-xs text-brand-text-light border-b pb-2">
                      تفاصيل الخدمة: {isCustomService ? 'خدمة مخصصة' : services.find((s: Service) => s.id === selectedServiceId)?.name}
                    </h4>

                    {isCustomService && (
                      <div>
                        <label className="block text-xs font-bold mb-2">اسم الخدمة المخصصة *</label>
                        <input
                          type="text"
                          required
                          value={customServiceName}
                          onChange={(e) => setCustomServiceName(e.target.value)}
                          placeholder="مثال: غسيل محرك بالمواد الكيميائية"
                          className="w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none text-right"
                        />
                      </div>
                    )}

                    {/* Conditional Fields: Oils Change */}
                    {(selectedCategoryId === 'cat1' || serviceCategories.find((c: ServiceCategory) => c.id === selectedCategoryId)?.name.includes('الزيوت')) && (
                      <div className="space-y-4 border p-4 rounded-2xl bg-indigo-50/10">
                        <h5 className="font-bold text-xs text-indigo-700">بيانات التغيير الفني للزيوت:</h5>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold mb-1">ماركة الزيت</label>
                            <select
                              value={oilBrand}
                              onChange={(e) => setOilBrand(e.target.value)}
                              className="w-full p-2 border rounded-xl text-xs"
                            >
                              {PredefinedOilBrands.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold mb-1">اسم المنتج</label>
                            <input
                              type="text"
                              value={oilProductName}
                              onChange={(e) => setOilProductName(e.target.value)}
                              placeholder="Helix Ultra"
                              className="w-full p-2 border rounded-xl text-xs text-right"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold mb-1">اللزوجة</label>
                            <select
                              value={oilViscosity}
                              onChange={(e) => setOilViscosity(e.target.value)}
                              className="w-full p-2 border rounded-xl text-xs"
                            >
                              {ViscosityOptions.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold mb-1">الكمية (لتر)</label>
                            <input
                              type="number"
                              value={oilLiters}
                              onChange={(e) => setOilLiters(parseFloat(e.target.value) || 4)}
                              className="w-full p-2 border rounded-xl text-xs text-right"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold mb-1">المسافة (كم)</label>
                            <input
                              type="number"
                              value={oilInterval}
                              onChange={(e) => setOilInterval(parseInt(e.target.value) || 5000)}
                              className="w-full p-2 border rounded-xl text-xs text-right"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conditional Fields: Brakes */}
                    {(selectedCategoryId === 'cat3' || serviceCategories.find((c: ServiceCategory) => c.id === selectedCategoryId)?.name.includes('الفرامل')) && (
                      <div className="space-y-4 border p-4 rounded-2xl bg-red-50/10">
                        <h5 className="font-bold text-xs text-red-700">بيانات الفرامل المخصصة:</h5>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold mb-1">درجة DOT</label>
                            <select value={oilDotGrade} onChange={(e) => setOilDotGrade(e.target.value)} className="w-full p-2 border rounded-xl">
                              <option value="DOT 3">DOT 3</option>
                              <option value="DOT 4">DOT 4</option>
                              <option value="DOT 5.1">DOT 5.1</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold mb-1">المحور</label>
                            <select value={oilAxle} onChange={(e) => setOilAxle(e.target.value)} className="w-full p-2 border rounded-xl">
                              <option value="Front">أمامي</option>
                              <option value="Rear">خلفي</option>
                              <option value="Both">كلاهما</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conditional Fields: AC */}
                    {(selectedCategoryId === 'cat4' || serviceCategories.find((c: ServiceCategory) => c.id === selectedCategoryId)?.name.includes('التكييف') || serviceCategories.find((c: ServiceCategory) => c.id === selectedCategoryId)?.name.includes('AC')) && (
                      <div className="space-y-4 border p-4 rounded-2xl bg-sky-50/10">
                        <h5 className="font-bold text-xs text-sky-700">بيانات شحن غاز المكيف:</h5>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold mb-1">نوع الغاز / الفريون</label>
                            <select value={acRefrigerantType} onChange={(e) => setAcRefrigerantType(e.target.value)} className="w-full p-2 border rounded-xl">
                              <option value="R134a">R134a</option>
                              <option value="R1234yf">R1234yf</option>
                              <option value="R22">R22</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold mb-1">الضغط قبل الشحن</label>
                            <input type="text" value={acPressureBefore} onChange={(e) => setAcPressureBefore(e.target.value)} className="w-full p-2 border rounded-xl text-right" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold mb-1">الضغط المستهدف</label>
                            <input type="text" value={acPressureAfter} onChange={(e) => setAcPressureAfter(e.target.value)} className="w-full p-2 border rounded-xl text-right" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simple Price & Qty Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-2">سعر الوحدة (د.ع) *</label>
                        <input
                          type="number"
                          required
                          value={isOilCategory ? oilPricePerLiter : (drawerUnitPrice || '')}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (isOilCategory) setOilPricePerLiter(val);
                            else setDrawerUnitPrice(val);
                          }}
                          className="w-full px-4 py-2.5 rounded-xl border text-xs text-right text-brand-text-light font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-2">الكمية المطلوبة</label>
                        <input
                          type="number"
                          required
                          value={isOilCategory ? oilLiters : drawerQty}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 1;
                            if (isOilCategory) setOilLiters(val);
                            else setDrawerQty(val);
                          }}
                          className="w-full px-4 py-2.5 rounded-xl border text-xs text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-2">ملاحظات إضافية للخدمة</label>
                      <textarea
                        value={drawerNotes}
                        onChange={(e) => setDrawerNotes(e.target.value)}
                        rows={2}
                        placeholder="أدخل أي ملاحظات فنية حول التركيب أو الضمان..."
                        className="w-full px-4 py-2.5 rounded-xl border text-xs text-right resize-none"
                      />
                    </div>

                  </div>
                )}

              </div>

              {/* Footer sticky drawer summary */}
              <div className="p-4 border-t bg-slate-50 dark:bg-slate-900/40 flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (drawerStep > 1) setDrawerStep(prev => prev - 1);
                    else setIsAddServiceOpen(false);
                  }}
                  className="px-4 py-2.5 border rounded-xl text-xs font-bold"
                >
                  السابق / إلغاء
                </button>

                {drawerStep === 3 ? (
                  <button
                    type="button"
                    onClick={handleDrawerServiceSubmit}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                  >
                    إضافة للزيارة
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={drawerStep === 2 && !selectedServiceId}
                    onClick={() => setDrawerStep(prev => prev + 1)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold disabled:opacity-40"
                  >
                    التالي
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Close Visit & Final Payment Overlay */}
      <AnimatePresence>
        {isCloseVisitOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCloseVisitOpen(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-brand-surface-dark rounded-3xl shadow-2xl p-6 z-10 text-right font-cairo overflow-hidden"
            >
              <h3 className="text-base font-bold text-brand-text-light pb-3 border-b flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                {visit?.invoiceIssued 
                  ? `إعادة إقفال كرت الصيانة وتحديث الفاتورة رقم: #${visit.invoiceNumber}`
                  : 'إقفال كرت الصيانة وإصدار الفاتورة النهائية'}
              </h3>

              <form onSubmit={handleCloseVisitSubmit} className="space-y-4 mt-4">
                
                {/* Exit details inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-2">عداد خروج السيارة (كم) *</label>
                    <input
                      type="number"
                      required
                      value={exitOdometer || ''}
                      onChange={(e) => setExitOdometer(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border rounded-xl text-xs text-right text-brand-text-light font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2">تاريخ خروج الورشة *</label>
                    <input
                      type="date"
                      required
                      value={exitDate}
                      onChange={(e) => setExitDate(e.target.value)}
                      className="w-full px-4 py-2 border rounded-xl text-xs text-right text-brand-text-light"
                    />
                  </div>
                </div>

                {/* Star rating */}
                <div>
                  <label className="block text-xs font-bold mb-1.5">تقييم جودة الصيانة والرضا الفني</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setInternalRating(star)}
                        className="transition-transform active:scale-90"
                      >
                        <Star className={`w-6 h-6 ${star <= internalRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Closing notes */}
                <div>
                  <label className="block text-xs font-bold mb-2">تقرير الفحص النهائي والتوصيات للزبون</label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    rows={2}
                    placeholder="التوصيات بزيارة قادمة أو قطع غيار ينصح بتبديلها لاحقاً..."
                    className="w-full px-4 py-2 border rounded-xl text-xs text-right resize-none"
                  />
                </div>

                {/* Final payment method details */}
                <div className="bg-slate-50 dark:bg-brand-bg-dark/50 p-4 rounded-2xl border space-y-4">
                  {visit?.invoiceIssued ? (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 p-3.5 rounded-xl text-xs font-semibold leading-relaxed">
                      <p className="text-blue-800 dark:text-blue-400 font-bold mb-1">
                        ℹ️ إعادة إغلاق الفاتورة وتحديثها:
                      </p>
                      <p className="text-blue-700 dark:text-blue-400">
                        تم إصدار الفاتورة سابقاً بالرقم <span className="font-mono font-bold">#{visit.invoiceNumber}</span>.
                        <br />
                        إجمالي المبالغ المدفوعة مسجلاً في النظام حالياً: <span className="font-bold text-emerald-600 dark:text-emerald-400">{(visit.totalPaid || 0).toLocaleString('ar-IQ')} د.ع</span>.
                        <br />
                        المتبقي لإجمالي الفاتورة الجديد: <span className="font-bold text-red-600 dark:text-red-400">{Math.max(0, grandTotal - (visit.totalPaid || 0)).toLocaleString('ar-IQ')} د.ع</span>.
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1.5 font-bold">
                        * تم تعيين قيمة الدفعة الحالية تلقائياً إلى صفر لتجنب تكرار تسجيل الدفعات. أدخل مبلغاً فقط في حال الرغبة بتسجيل دفعة جديدة.
                      </p>
                    </div>
                  ) : (
                    <h4 className="font-bold text-xs text-indigo-700">سداد الحساب النهائي للفاتورة:</h4>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold mb-1">طريقة السداد</label>
                      <select
                        value={closePaymentMethod}
                        onChange={(e) => setClosePaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full p-2 border rounded-xl text-xs font-cairo"
                      >
                        <option value="cash">نقداً (Cash)</option>
                        <option value="card">بطاقة دفع (Card)</option>
                        <option value="transfer">تحويل بنكي / مصرفي</option>
                        <option value="electronic">دفع إلكتروني (ZainCash / AsiaHawala)</option>
                        <option value="deferred">آجل / دين بالكامل</option>
                        <option value="partial">دفع جزئي</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold mb-1">المبلغ المطلوب سداده</label>
                      <div className="w-full p-2 border rounded-xl text-xs text-left bg-slate-100 font-extrabold text-indigo-600">
                        {grandTotal.toLocaleString('ar-IQ')} د.ع
                      </div>
                    </div>
                  </div>

                  {/* Quick percentage buttons for paid amount */}
                  {(closePaymentMethod === 'partial' || visit?.invoiceIssued) && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold mb-1">
                          {visit?.invoiceIssued 
                            ? 'قيمة الدفعة الجديدة حالياً (أدخل 0 في حال عدم السداد الآن)'
                            : 'المبلغ المدفوع حالياً'}
                        </label>
                        <input
                          type="number"
                          value={closePaidAmount || ''}
                          onChange={(e) => setClosePaidAmount(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border rounded-xl text-xs text-right font-bold text-emerald-600"
                        />
                      </div>
                      
                      {!visit?.invoiceIssued && (
                        <div className="flex gap-2 justify-end">
                          {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setClosePaidAmount(Math.round(grandTotal * pct))}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border rounded-lg text-[10px] font-bold text-slate-700"
                            >
                              {pct * 100}% ({(Math.round(grandTotal * pct)).toLocaleString('ar-IQ')} د.ع)
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ZainCash / AsiaHawala Details */}
                  {closePaymentMethod === 'electronic' && (
                    <div className="grid grid-cols-3 gap-2 border-t pt-3">
                      <div>
                        <label className="block text-[10px] font-bold mb-1">المنصة الإلكترونية</label>
                        <select value={closePlatform} onChange={(e) => setClosePlatform(e.target.value)} className="w-full p-1.5 border rounded-lg text-[10px]">
                          <option value="ZainCash">Zain Cash (زين كاش)</option>
                          <option value="AsiaHawala">AsiaHawala (آسيا حوالة)</option>
                          <option value="FastPay">FastPay (فاست بي)</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold mb-1">رقم الإيصال / الرقم المرجعي للمعاملة (Transaction ID)</label>
                        <input
                          type="text"
                          required
                          value={closeReceiptNumber}
                          onChange={(e) => setCloseReceiptNumber(e.target.value)}
                          placeholder="أدخل رمز التحقق المالي المعاملة..."
                          className="w-full p-1.5 border rounded-lg text-[10px] text-right"
                        />
                      </div>
                    </div>
                  )}

                  {/* Deferred due date & guarantor */}
                  {(closePaymentMethod === 'deferred' || closePaymentMethod === 'partial') && (
                    <div className="grid grid-cols-2 gap-3 border-t pt-3">
                      <div>
                        <label className="block text-[10px] font-bold mb-1">تاريخ سداد الدين المحدد</label>
                        <input
                          type="date"
                          value={closeDeferredDueDate}
                          onChange={(e) => setCloseDeferredDueDate(e.target.value)}
                          className="w-full p-2 border rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold mb-1">اسم الكفيل / الضامن (إن وجد)</label>
                        <input
                          type="text"
                          value={closeDeferredGuarantor}
                          onChange={(e) => setCloseDeferredGuarantor(e.target.value)}
                          placeholder="اسم الضامن المعتمد..."
                          className="w-full p-2 border rounded-xl text-xs text-right"
                        />
                      </div>
                    </div>
                  )}

                </div>

                <div className="flex justify-between items-center gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsCloseVisitOpen(false)}
                    className="px-5 py-2.5 border rounded-xl text-xs font-bold"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-600/10"
                  >
                    <Check className="w-4 h-4" />
                    <span>تأكيد الإقفال وإصدار الفاتورة</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success transition screen */}
      <AnimatePresence>
        {showSuccessScreen && visit && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-brand-bg-dark text-right font-cairo">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              style={{
                textAlign: 'center',
                padding: '40px',
                direction: 'rtl',
              }}
            >
              <div style={{ fontSize:'48px', marginBottom:'16px' }}>
                ✅
              </div>
              <h2 style={{ fontSize:'22px', fontWeight:'700',
                           marginBottom:'8px', color: 'var(--color-text-primary, #0f172a)' }}>
                تم إغلاق الزيارة بنجاح
              </h2>
              <p style={{ color:'var(--color-text-secondary, #475569)',
                          marginBottom:'24px' }}>
                {closedInvoiceNumber}
              </p>

              {/* Payment Summary Card */}
              <div style={{
                background: 'var(--color-background-secondary, #f8fafc)',
                border: '1px solid var(--color-border-tertiary, #cbd5e1)',
                borderRadius: '14px',
                padding: '20px',
                maxWidth: '360px',
                margin: '0 auto 24px',
                textAlign: 'right',
              }}>
                <h3 style={{ margin:'0 0 14px',
                             color: 'var(--color-text-primary, #0f172a)',
                             fontSize:'15px', fontWeight:'600' }}>
                  ملخص الدفع
                </h3>
                {[
                  { label: 'إجمالي الفاتورة',
                    value: visit.total,
                    color: 'var(--color-text-primary, #0f172a)',
                    bold: false },
                  { label: 'المبلغ المدفوع',
                    value: visit.totalPaid,
                    color: '#16A34A',
                    bold: true },
                  { label: 'المبلغ المتبقي',
                    value: visit.totalRemaining,
                    color: visit.totalRemaining > 0 ? '#DC2626' : '#16A34A',
                    bold: true },
                ].map((row) => (
                  <div key={row.label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--color-border-tertiary, #cbd5e1)',
                  }}>
                    <span style={{
                      color: 'var(--color-text-secondary, #475569)',
                      fontSize: '14px',
                    }}>
                      {row.label}
                    </span>
                    <span style={{
                      color: row.color,
                      fontWeight: row.bold ? '700' : '500',
                      fontSize: '14px',
                    }}>
                      {Number(row.value || 0).toLocaleString('ar-IQ')} د.ع
                    </span>
                  </div>
                ))}

                {/* Payment status badge */}
                <div style={{ textAlign:'center', marginTop:'12px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '5px 16px',
                    borderRadius: '99px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background:
                      visit.paymentStatus === 'paid'    ? '#DCFCE7' :
                      visit.paymentStatus === 'partial' ? '#FEF3C7' : '#FEE2E2',
                    color:
                      visit.paymentStatus === 'paid'    ? '#16A34A' :
                      visit.paymentStatus === 'partial' ? '#92400E' : '#DC2626',
                  }}>
                    {visit.paymentStatus === 'paid'     ? '✅ مدفوع بالكامل' :
                     visit.paymentStatus === 'partial'  ? '🟡 دفع جزئي'     :
                     visit.paymentStatus === 'deferred' ? '📋 آجل'           :
                                                          '🔴 غير مدفوع'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{
                display: 'flex', gap: '10px',
                justifyContent: 'center', flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => {
                    handlePrint();
                    setTimeout(() => window.print(), 100);
                  }}
                  style={primaryButtonStyle}
                >
                  🖨️ طباعة الفاتورة
                </button>
                <button
                  onClick={() => {
                    setShowSuccessScreen(false);
                    navigate('/visits');
                  }}
                  style={secondaryButtonStyle}
                >
                  العودة للزيارات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Note dialog per row */}
      <AnimatePresence>
        {editingNotesVsId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingNotesVsId(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-5 text-right font-cairo z-10"
            >
              <h4 className="font-bold text-xs text-brand-text-light pb-2 border-b">إضافة ملاحظات الفني للخدمة</h4>
              <textarea
                value={tempRowNotes}
                onChange={(e) => setTempRowNotes(e.target.value)}
                rows={4}
                className="w-full p-3 border rounded-xl text-xs text-right mt-3 focus:outline-none resize-none"
                placeholder="أدخل أي ملاحظات فنية حول قطع الغيار أو الصيانة..."
              />
              <div className="flex justify-end gap-2 mt-4 border-t pt-3">
                <button onClick={() => setEditingNotesVsId(null)} className="px-4 py-1.5 bg-slate-100 rounded-lg text-xs font-bold">إلغاء</button>
                <button onClick={saveRowNotes} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">حفظ الملاحظات</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: A4 Invoice print view */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        size="lg"
        title="معاينة فاتورة الحساب الفاخرة للزبون"
      >
        <div className="space-y-6">
          <div className="flex gap-3 justify-end no-print">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold font-cairo flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة (A4)</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark text-brand-text-light dark:text-brand-text-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark text-xs font-semibold font-cairo flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تحميل كملف PDF</span>
            </button>
            <button
              onClick={() => {
                if (invoice) {
                  navigator.clipboard.writeText(invoice.invoiceNumber);
                  setCopiedInvoiceNumber(true);
                  toast.success('تم نسخ رقم الفاتورة');
                  setTimeout(() => setCopiedInvoiceNumber(false), 2000);
                }
              }}
              className="px-4 py-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark text-brand-text-light dark:text-brand-text-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark text-xs font-semibold font-cairo flex items-center gap-1.5 transition-all"
            >
              {copiedInvoiceNumber ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>نسخ رقم الفاتورة</span>
            </button>
          </div>

          <div className="overflow-x-auto bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-brand-border-light dark:border-brand-border-dark flex justify-center">
            <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center', width: '210mm', minWidth: '210mm' }}>
              <InvoicePrintView 
                visit={visit}
                customer={customer}
                car={car}
                technician={technician ? technician.name : '-'}
                currentVisitServices={currentVisitServices}
                invoice={invoice || invoices.find((inv: Invoice) => inv.visitId === visit.id)}
                payment={payment || payments.find((p: Payment) => p.visitId === visit.id)}
                settings={settings}
                invoiceSettings={invoiceSettings}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-brand-border-light dark:border-brand-border-dark flex justify-end no-print font-cairo text-xs font-semibold">
            <button
              onClick={() => setIsInvoiceOpen(false)}
              className="px-5 py-2 rounded-xl bg-slate-100 text-brand-text-light"
            >
              إغلاق المعاينة
            </button>
          </div>
        </div>
      </Modal>

      {/* Unlock Visit Modal */}
      {showUnlockModal && (
        <Modal
          isOpen={showUnlockModal}
          onClose={() => setShowUnlockModal(false)}
          title="تأكيد فك قفل الزيارة"
          size="sm"
        >
          <div className="space-y-4 font-cairo text-right">
            <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark">
              فك قفل الزيارة يتيح للموظفين إمكانية تعديل الخدمات وإجراء التغييرات. يرجى إدخال سبب فك القفل لتوثيقه في سجل النشاطات:
            </p>
            <div>
              <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark mb-1.5">
                سبب فك القفل *
              </label>
              <textarea
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="مثال: إضافة خدمة زيت ناقل حركة بناءً على طلب العميل"
                rows={3}
                className="w-full px-3 py-2 text-xs border border-brand-border-light dark:border-brand-border-dark rounded-xl bg-slate-50 dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlock}
                disabled={!unlockReason.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
              >
                تأكيد فك القفل
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default VisitDetails;
