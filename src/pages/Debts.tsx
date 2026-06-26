import React, { useState } from 'react';
import { openWhatsApp, buildDebtReminderMessage } from '../utils/whatsapp';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Payment, Customer, Car, Invoice, Visit } from '../store/store';
import { 
  Coins, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Search, 
  User, 
  Car as CarIcon, 
  FileText, 
  Check, 
  Clock, 
  Filter,
  Send,
  Eye,
  DollarSign,
  X,
  CreditCard
} from 'lucide-react';
import { toast } from '../store/toastStore';
import { useNavigate } from 'react-router-dom';

const Debts: React.FC = () => {
  const navigate = useNavigate();
  
  // Store States & Actions
  const payments = useStore((state) => state.payments);
  const customers = useStore((state) => state.customers);
  const cars = useStore((state) => state.cars);
  const invoices = useStore((state) => state.invoices);
  const visits = useStore((state) => state.visits);
  const markPaymentAsPaid = useStore((state) => state.markPaymentAsPaid);
  const addPayment = useStore((state) => state.addPayment);
  const settings = useStore((state) => state.settings);

  // States
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'month' | 'upcoming'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Partial Payment Modal States
  const [selectedPaymentForPartial, setSelectedPaymentForPartial] = useState<Payment | null>(null);
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [partialNotes, setPartialNotes] = useState('');

  // Helpers
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ar-IQ') + ' ' + settings.currency;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getCustomer = (customerId: string): Customer | undefined => {
    return customers.find((c: Customer) => c.id === customerId);
  };

  const getCar = (carId: string): Car | undefined => {
    return cars.find((c: Car) => c.id === carId);
  };

  const getInvoice = (invoiceId: string): Invoice | undefined => {
    return invoices.find((inv: Invoice) => inv.id === invoiceId);
  };

  // Check if a payment is overdue
  const isOverdue = (payment: Payment) => {
    if (payment.status === 'paid') return false;
    const today = new Date().toISOString().split('T')[0];
    return (payment.dueDate || '') < today;
  };

  // Check if a payment is due within the current calendar month
  const isWithinCurrentMonth = (payment: Payment) => {
    if (payment.status === 'paid') return false;
    const today = new Date();
    const dueDate = new Date(payment.dueDate || '');
    return dueDate.getFullYear() === today.getFullYear() && dueDate.getMonth() === today.getMonth();
  };

  // Check if a payment is due within the next 7 days
  const isUpcoming = (payment: Payment) => {
    if (payment.status === 'paid') return false;
    const today = new Date();
    const dueDate = new Date(payment.dueDate || '');
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff >= 0 && daysDiff <= 7;
  };

  // Calculate KPIs (only for active unpaid/partial debts)
  const activeDebts = payments.filter((p: Payment) => p.status !== 'paid');
  
  const totalOutstanding = activeDebts.reduce((sum: number, p: Payment) => sum + (p.remainingAmount || 0), 0);
  const totalOverdue = activeDebts.filter(isOverdue).reduce((sum: number, p: Payment) => sum + (p.remainingAmount || 0), 0);
  const totalCurrentMonth = activeDebts.filter(isWithinCurrentMonth).reduce((sum: number, p: Payment) => sum + (p.remainingAmount || 0), 0);
  const totalUpcoming = activeDebts.filter(isUpcoming).reduce((sum: number, p: Payment) => sum + (p.remainingAmount || 0), 0);

  // Filtered Payments list
  const filteredPayments = activeDebts.filter((payment: Payment) => {
    const customer = getCustomer(payment.customerId || '');
    const visitObj = visits.find((v: Visit) => v.id === payment.visitId);
    const carVisit = visitObj ? cars.find((c: Car) => c.id === visitObj.carId) : undefined;
    const invoice = getInvoice(payment.invoiceId || '');

    const matchesSearch = 
      (customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer?.phone || '').includes(searchTerm) ||
      (carVisit?.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (carVisit?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice?.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'overdue') return isOverdue(payment);
    if (statusFilter === 'month') return isWithinCurrentMonth(payment);
    if (statusFilter === 'upcoming') return isUpcoming(payment);

    return true;
  });

  // Action: Pay Full
  const handlePayFull = (payment: Payment) => {
    const customer = getCustomer(payment.customerId || '');
    if (window.confirm(`هل أنت متأكد من تسديد الدين المتبقي بالكامل (${formatCurrency(payment.remainingAmount || 0)}) للعميل ${customer?.name || ''}؟`)) {
      markPaymentAsPaid(payment.id, 'u3');
      toast.success('تمت عملية تسديد الدين بالكامل بنجاح');
    }
  };

  // Action: Partial Payment Submit
  const handlePartialPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForPartial) return;

    if (partialAmount <= 0) {
      toast.error('يرجى إدخال مبلغ دفع أكبر من الصفر');
      return;
    }

    if (partialAmount > (selectedPaymentForPartial.remainingAmount || 0)) {
      toast.error(`خطأ: المبلغ المدخل أكبر من المتبقي المتبقي (${(selectedPaymentForPartial.remainingAmount || 0).toLocaleString('ar-IQ')} د.ع)`);
      return;
    }

    // Call addPayment action with visitId and amount
    addPayment({
      visitId: selectedPaymentForPartial.visitId,
      paidAmount: partialAmount,
      method: 'cash',
      notes: partialNotes || 'سداد دفعة جزئية من الدين',
      operatorId: 'u3'
    });

    toast.success('تم تسجيل الدفعة الجزئية بنجاح بنجاح');
    setSelectedPaymentForPartial(null);
    setPartialAmount(0);
    setPartialNotes('');
  };

  // Action: WhatsApp Reminder
  const handleWhatsAppReminder = (payment: Payment) => {
    const cust = customers.find((c: any) => c.id === payment.customerId);
    if (!cust) return;
    const car = cars.find((c: any) => {
      const visit = visits.find((v: any) => v.id === payment.visitId);
      return visit && c.id === visit.carId;
    });
    const msg = buildDebtReminderMessage({
      customerName: cust.name,
      carBrand: car?.brand,
      carName: car?.name,
      remainingAmount: payment.remainingAmount || 0,
      dueDate: payment.dueDate || (payment as any).deferredDueDate,
    });
    openWhatsApp(cust.phone, msg);
  };

  return (
    <div className="space-y-6 font-cairo">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">سجل متابعة الديون والذمم الآجلة</h2>
          <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark mt-1 font-cairo">إدارة ومتابعة فواتير الدفع الجزئي، الديون المستحقة، ومواعيد السداد للعملاء</p>
        </div>
      </div>

      {/* Finance Summary Cards */}
      {(() => {
        const totalRevenue = visits.reduce((s: number, v: any) => s + (v.total || v.totalAmount || 0), 0);
        const totalCollected = visits.reduce((s: number, v: any) => s + (v.totalPaid || v.paidAmount || 0), 0);
        const totalDebtAmount = visits.reduce((s: number, v: any) => s + (v.totalRemaining || v.remainingAmount || 0), 0);
        const overdueCount = visits.filter((v: any) => {
          if (v.paymentStatus === 'paid' || v.status === 'paid') return false;
          const payments = v.payments || [];
          const duePayment = payments.find((p: any) => p.isDeferred && p.deferredDueDate);
          if (!duePayment) return false;
          return new Date(duePayment.deferredDueDate) < new Date();
        }).length;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'إجمالي الإيرادات', value: totalRevenue, icon: '💰', color: 'indigo', suffix: 'د.ع' },
              { label: 'المحصّل', value: totalCollected, icon: '✅', color: 'emerald', suffix: 'د.ع' },
              { label: 'الديون المعلقة', value: totalDebtAmount, icon: '⚠️', color: 'red', suffix: 'د.ع' },
              { label: 'متأخرة السداد', value: overdueCount, icon: '🔴', color: 'amber', suffix: 'زيارة' },
            ].map((card) => (
              <div key={card.label} className={`bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl p-5 shadow-sm`}>
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className={`text-xl font-bold text-${card.color}-600`}>
                  {typeof card.value === 'number' ? card.value.toLocaleString('ar-IQ') : card.value} {card.suffix}
                </div>
                <div className="text-xs text-brand-muted-light dark:text-brand-muted-dark mt-1">{card.label}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Outstanding */}
        <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark uppercase tracking-wider block">إجمالي الديون المعلقة</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-cairo">{formatCurrency(totalOutstanding)}</h3>
            <span className="text-[10px] text-amber-500 font-semibold block">سداد غير مكتمل</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Overdue Debts */}
        <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark uppercase tracking-wider block">ديون متجاوزة الاستحقاق</span>
            <h3 className="text-lg font-black text-red-600 dark:text-red-400 font-cairo">{formatCurrency(totalOverdue)}</h3>
            <span className="text-[10px] text-red-500 font-semibold block">فات موعد سدادها</span>
          </div>
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Due this month */}
        <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark uppercase tracking-wider block">مستحقة هذا الشهر</span>
            <h3 className="text-lg font-black text-indigo-600 dark:text-brand-accent-light font-cairo">{formatCurrency(totalCurrentMonth)}</h3>
            <span className="text-[10px] text-indigo-500 font-semibold block font-cairo">خلال الشهر الحالي</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-brand-accent-light rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Upcoming Due (7 days) */}
        <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark uppercase tracking-wider block">مستحقة خلال 7 أيام</span>
            <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-cairo">{formatCurrency(totalUpcoming)}</h3>
            <span className="text-[10px] text-emerald-500 font-semibold block">مطلوب تحصيلها قريباً</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filter Tabs */}
      <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs font-cairo text-xs">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted-light dark:text-brand-muted-dark" />
            <input
              type="text"
              placeholder="ابحث باسم الزبون، الهاتف، أو رقم الفاتورة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:border-indigo-500 text-right transition-colors"
            />
          </div>

          {/* Filter Action Buttons */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto font-cairo text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                  : 'bg-brand-surface-light dark:bg-brand-bg-dark text-brand-muted-light dark:text-brand-muted-dark hover:text-brand-text-light dark:hover:text-brand-text-dark border border-brand-border-light dark:border-brand-border-dark'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>كل المطالبات ({activeDebts.length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                statusFilter === 'overdue'
                  ? 'bg-red-600 text-white dark:bg-red-500'
                  : 'bg-red-50 dark:bg-red-950/15 text-red-600 dark:text-red-400 hover:bg-red-100/50 border border-red-100/50 dark:border-red-950/45'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>متجاوزة الاستحقاق ({activeDebts.filter(isOverdue).length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('month')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                statusFilter === 'month'
                  ? 'bg-indigo-600 text-white dark:bg-brand-accent-light'
                  : 'bg-indigo-50 dark:bg-indigo-950/15 text-indigo-600 dark:text-brand-accent-light hover:bg-indigo-100/50 border border-indigo-100/50 dark:border-indigo-950/45'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>مستحقة هذا الشهر ({activeDebts.filter(isWithinCurrentMonth).length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                statusFilter === 'upcoming'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/50 border border-emerald-100/50 dark:border-emerald-950/45'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>مستحقة قريباً (7 أيام) ({activeDebts.filter(isUpcoming).length})</span>
            </button>
          </div>

        </div>

        {/* Debts Table */}
        <div className="overflow-x-auto border border-brand-border-light dark:border-brand-border-dark rounded-xl">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-brand-surface-light dark:bg-brand-bg-dark border-b border-brand-border-light dark:border-brand-border-dark text-brand-muted-light dark:text-brand-muted-dark font-bold font-cairo">
                <th className="p-4">الزبون</th>
                <th className="p-4">السيارة</th>
                <th className="p-4">رقم الفاتورة</th>
                <th className="p-4">المجموع الكلي</th>
                <th className="p-4">المدفوع</th>
                <th className="p-4">المتبقي (الدين)</th>
                <th className="p-4">تاريخ الاستحقاق</th>
                <th className="p-4">الضامن</th>
                <th className="p-4 text-center">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light dark:divide-brand-border-dark">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-brand-muted-light dark:text-brand-muted-dark font-cairo">
                    لا توجد سجلات.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment: Payment) => {
                  const customer = getCustomer(payment.customerId || '');
                  const visitObj = visits.find((v: Visit) => v.id === payment.visitId);
                  const car = visitObj ? getCar(visitObj.carId) : undefined;
                  const invoice = getInvoice(payment.invoiceId || '');
                  
                  const paymentOverdue = isOverdue(payment);

                  return (
                    <tr key={payment.id} className="hover:bg-brand-surface-light/30 dark:hover:bg-brand-bg-dark/30 transition-colors">
                      {/* Customer Info */}
                      <td className="p-4 font-semibold">
                        {customer ? (
                          <div className="space-y-0.5">
                            <p className="font-bold">{customer.name}</p>
                            <p className="text-[10px] text-brand-muted-light dark:text-brand-muted-dark">{customer.phone}</p>
                          </div>
                        ) : (
                          'زبون محذوف'
                        )}
                      </td>
                      
                      {/* Vehicle Info */}
                      <td className="p-4 text-slate-500">
                        {car ? (
                          <div className="flex items-center gap-1.5">
                            <CarIcon className="w-3.5 h-3.5 text-brand-muted-light" />
                            <span>{car.brand} {car.name} ({car.plateNumber})</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      
                      {/* Invoice Info */}
                      <td className="p-4 text-slate-500">
                        {invoice ? (
                          <div className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-brand-muted-light" />
                            <span className="font-semibold text-indigo-600 dark:text-brand-accent-light">{invoice.invoiceNumber}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      
                      {/* Financial values */}
                      <td className="p-4 font-bold">{formatCurrency(payment.totalAmount || 0)}</td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(payment.paidAmount || 0)}</td>
                      <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                        <span className={paymentOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                          {formatCurrency(payment.remainingAmount || 0)}
                        </span>
                      </td>
                      
                      {/* Due Date */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className={paymentOverdue ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
                            {formatDate(payment.dueDate || '')}
                          </p>
                          {paymentOverdue && (
                            <span className="text-[9px] bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-1.5 py-0.5 rounded font-black">
                              متجاوزة!
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Guarantor */}
                      <td className="p-4 text-brand-text-light font-medium">
                        {payment.deferredGuarantor || '-'}
                      </td>
                      
                      {/* Action buttons */}
                      <td className="p-4 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <button
                            onClick={() => handlePayFull(payment)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold font-cairo flex items-center gap-1 transition-all shadow-sm"
                          >
                            <Check className="w-3 h-3" />
                            <span>سداد كامل</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedPaymentForPartial(payment);
                              setPartialAmount(payment.remainingAmount || 0);
                              setPartialNotes(payment.notes || '');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold font-cairo flex items-center gap-1 transition-all border"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>دفعة جزئية</span>
                          </button>
                          
                          <button
                            onClick={() => handleWhatsAppReminder(payment)}
                            className="p-1.5 rounded-lg border hover:bg-slate-50 text-[10px] font-bold text-slate-600 flex items-center gap-1"
                          >
                            <Send className="w-3 h-3 text-emerald-500" />
                            <span>واتساب</span>
                          </button>
                          
                          <button
                            onClick={() => navigate(`/visits/${payment.visitId}`)}
                            className="p-1.5 rounded-lg border hover:bg-slate-50 text-[10px]"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partial Payment Modal */}
      <AnimatePresence>
        {selectedPaymentForPartial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedPaymentForPartial(null)} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-brand-surface-dark rounded-2xl shadow-xl p-6 text-right font-cairo z-10 border border-brand-border-light dark:border-brand-border-dark"
            >
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h4 className="font-bold text-sm text-brand-text-light dark:text-brand-text-dark flex items-center gap-1.5">
                  <CreditCard className="w-4.5 h-4.5 text-indigo-500" />
                  تسجيل دفعة جزئية من الدين
                </h4>
                <button onClick={() => setSelectedPaymentForPartial(null)} className="text-brand-muted-light">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePartialPaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-2">اسم العميل المالك</label>
                  <div className="w-full p-2.5 bg-slate-100 rounded-xl text-xs font-bold">
                    {getCustomer(selectedPaymentForPartial.customerId || '')?.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                  <div>
                    <label className="block mb-1">الدين المتبقي الحالي</label>
                    <div className="p-2 border rounded-xl bg-slate-50 text-amber-600 text-left">
                      {(selectedPaymentForPartial.remainingAmount || 0).toLocaleString('ar-IQ')} د.ع
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1">المبلغ المطلوب تسديده *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={selectedPaymentForPartial.remainingAmount || 0}
                      value={partialAmount || ''}
                      onChange={(e) => setPartialAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded-xl text-right text-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2">ملاحظات التحصيل المالي</label>
                  <textarea
                    value={partialNotes}
                    onChange={(e) => setPartialNotes(e.target.value)}
                    rows={2}
                    placeholder="ملاحظات حول تحصيل هذه الدفعة..."
                    className="w-full p-2.5 border rounded-xl text-xs text-right resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t pt-3 mt-4 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentForPartial(null)}
                    className="px-4 py-2 bg-slate-100 rounded-lg"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    تسجيل الدفعة
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Debts;
