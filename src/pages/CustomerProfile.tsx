import React, { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Edit2, 
  Plus, 
  Car as CarIcon, 
  History, 
  Calendar, 
  Wrench, 
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  UserCheck,
  AlertTriangle,
  Send,
  MessageCircle,
  TrendingUp,
  CreditCard,
  DollarSign,
  Clock,
  Shield,
  Activity,
  Trash2,
  Copy,
  Paperclip,
  Upload,
  PieChart as PieIcon,
  BarChart as BarIcon,
  Search,
  ExternalLink,
  Tag,
  CheckCircle2,
  AlertCircle,
  Bell
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useStore, useVisitStore, useCustomerStore, Customer, Car, Visit, VisitStatus, User as AppUser, VisitService, Invoice, Payment, CustomerDocument } from '../store/store';
import { toast } from '../store/toastStore';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { toLatinNumerals, toArabicNumerals } from '../components/InvoicePrintView';

// Helper to format date
const formatDateLocal = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('ar-IQ', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const formatCurrencyLocal = (val: number, curr = 'د.ع') => {
  return `${val.toLocaleString('ar-IQ')} ${curr}`;
};

const getInitials = (fullName: string) => {
  return fullName.split(' ').map(n => n[0]).slice(0, 2).join('');
};

interface CustomerVisitsTabProps {
  customerId: string;
  onAddVisit: () => void;
}

const CustomerVisitsTab: React.FC<CustomerVisitsTabProps> = ({ customerId, onAddVisit }) => {
  const allVisits = useVisitStore((s) => s.visits);
  const allCars = useCustomerStore((s) => s.cars);

  const visits = allVisits.filter((v) => v.customerId === customerId);

  const sorted = [...visits].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl w-full">
        <div className="w-12 h-12 mx-auto text-slate-350 dark:text-slate-600 opacity-40 mb-3 flex items-center justify-center">
          <Wrench className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 font-cairo">لا توجد زيارات بعد</p>
        <button
          onClick={onAddVisit}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-cairo shadow-sm transition-all"
        >
          إضافة أول زيارة
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {sorted.map((visit) => {
        const car = allCars.find((c) => c.id === visit.carId);
        return <VisitCard key={visit.id} visit={visit} car={car} />;
      })}
    </div>
  );
};

const VisitCard: React.FC<{ visit: any; car: any }> = ({ visit, car }) => {
  const navigate = useNavigate();

  const statusConfig = {
    received:    { label: 'استُقبلت',     color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
    in_progress: { label: 'قيد التنفيذ',  color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
    done:        { label: 'انتهت',        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
    delivered:   { label: 'سُلِّمت',      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
  };

  const st = statusConfig[visit.status as keyof typeof statusConfig] || statusConfig.received;

  return (
    <div
      className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow text-right font-cairo w-full"
      onClick={() => navigate(`/visits/${visit.id}`)}
    >
      {(visit.status === 'received' || visit.status === 'in_progress' ||
        visit.status === 'منتظر' || visit.status === 'استقبلت' ||
        visit.status === 'قيد الفحص' || visit.status === 'قيد التنفيذ') && (
        <div className="flex items-center gap-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" style={{ animation: 'pulse 1.5s infinite' }}></span>
          <span className="text-xs font-bold text-amber-700">زيارة مفتوحة — لم تنته بعد</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/visits/${visit.id}`);
            }}
            className="mr-auto px-3 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-md hover:bg-amber-600 transition-colors"
          >
            متابعة الزيارة ←
          </button>
        </div>
      )}
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-[10px] font-bold text-slate-400 block font-mono">
            {visit.id}
          </span>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight mt-1">
            {car
              ? `${car.brand} ${car.name} — ${car.plateNumber}`
              : 'سيارة غير معروفة'}
          </h4>
        </div>
        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${st.color}`}>
          {st.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-50 dark:border-slate-800/40">
        <span>📅 {new Date(visit.entryDate).toLocaleDateString('ar-IQ')}</span>
        <span>🔧 {(visit.services || []).length} خدمة</span>
        <span>💰 {(visit.total || 0).toLocaleString('ar-IQ')} د.ع</span>
        <span className={`font-bold ${
          visit.paymentStatus === 'paid'     ? 'text-emerald-600' :
          visit.paymentStatus === 'partial'  ? 'text-amber-600' : 'text-red-500'
        }`}>
          {visit.paymentStatus === 'paid'     ? '✅ مدفوع بالكامل' :
           visit.paymentStatus === 'partial'  ? '🟡 دفع جزئي' :
           visit.paymentStatus === 'deferred' ? '📋 آجل' : '🔴 غير مدفوع'}
        </span>
      </div>
    </div>
  );
};

interface OpenVisitAlertProps {
  visit: any;
  car: any;
  onNavigate: (path: string) => void;
}

function OpenVisitAlert({ visit, car, onNavigate }: OpenVisitAlertProps) {
  if (!visit) return null;

  const statusLabel =
    visit.status === 'received'    ? 'في الاستقبال'   :
    visit.status === 'in_progress' ? 'قيد التنفيذ'    :
    visit.status === 'استقبلت' ? 'استُقبلت' :
    visit.status === 'منتظر' ? 'منتظر' :
    visit.status === 'قيد الفحص' ? 'قيد الفحص' :
    visit.status === 'قيد التنفيذ' ? 'قيد التنفيذ' : visit.status;

  const statusColor =
    visit.status === 'received' || visit.status === 'استقبلت' || visit.status === 'منتظر' ? '#3B82F6' :
    visit.status === 'in_progress' || visit.status === 'قيد التنفيذ' || visit.status === 'قيد الفحص' ? '#F59E0B' : '#6366F1';

  // How long ago was the visit opened
  const minutesAgo = Math.floor(
    (Date.now() - new Date(visit.createdAt).getTime())
    / 60000
  );
  const timeLabel =
    minutesAgo < 60
      ? `منذ ${minutesAgo} دقيقة`
      : minutesAgo < 1440
      ? `منذ ${Math.floor(minutesAgo / 60)} ساعة`
      : `منذ ${Math.floor(minutesAgo / 1440)} يوم`;

  return (
    <div
      onClick={() => onNavigate(`/visits/${visit.id}`)}
      style={{
        // Animated gradient border effect
        background:    'linear-gradient(135deg, #1E293B, #0F172A)',
        border:        `1.5px solid ${statusColor}`,
        borderRadius:  '14px',
        padding:       '16px 20px',
        marginBottom:  '20px',
        cursor:        'pointer',
        direction:     'rtl',
        position:      'relative',
        overflow:      'hidden',
        transition:    'transform 0.15s, box-shadow 0.15s',
        boxShadow:     `0 0 20px ${statusColor}22`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow =
          `0 4px 24px ${statusColor}33`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow =
          `0 0 20px ${statusColor}22`;
      }}
    >
      {/* Glowing left border accent */}
      <div style={{
        position:     'absolute',
        right:        0,
        top:          0,
        bottom:       0,
        width:        '4px',
        background:   statusColor,
        borderRadius: '0 14px 14px 0',
        boxShadow:    `0 0 12px ${statusColor}`,
      }} />

      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '12px',
      }}>

        {/* Right side: icon + info */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '14px',
        }}>
          {/* Pulsing dot */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{
              width:        '42px',
              height:       '42px',
              borderRadius: '50%',
              background:   `${statusColor}22`,
              border:       `2px solid ${statusColor}`,
              display:      'flex',
              alignItems:   'center',
              justifyContent:'center',
            }}>
              <CarIcon size={20} color={statusColor} />
            </div>
            {/* Pulse ring */}
            <div style={{
              position:     'absolute',
              inset:        '-4px',
              borderRadius: '50%',
              border:       `2px solid ${statusColor}`,
              animation:    'pingRing 1.5s ease-out infinite',
              opacity:      0,
            }} />
          </div>

          {/* Visit info */}
          <div>
            <div style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '8px',
              marginBottom:'4px',
            }}>
              {/* Live badge */}
              <span style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '4px',
                background:   `${statusColor}22`,
                border:       `1px solid ${statusColor}44`,
                borderRadius: '99px',
                padding:      '2px 8px',
                fontSize:     '11px',
                fontWeight:   '700',
                color:        statusColor,
              }}>
                <span style={{
                  width:        '6px',
                  height:       '6px',
                  borderRadius: '50%',
                  background:   statusColor,
                  display:      'inline-block',
                  animation:    'pulse 1.2s infinite',
                }} />
                {statusLabel}
              </span>

              <span style={{
                fontSize: '12px',
                color:    '#64748B',
              }}>
                {timeLabel}
              </span>
            </div>

            <div style={{
              color:      '#F1F5F9',
              fontSize:   '15px',
              fontWeight: '600',
              marginBottom:'2px',
            }}>
              {car
                ? `${car.brand} ${car.name} ${car.year}`
                : 'سيارة غير معروفة'}
              {car?.plateNumber && (
                <span style={{
                  marginRight:  '8px',
                  fontSize:     '12px',
                  color:        '#94A3B8',
                  background:   '#1E293B',
                  padding:      '1px 8px',
                  borderRadius: '4px',
                  border:       '1px solid #334155',
                }}>
                  {car.plateNumber}
                </span>
              )}
            </div>

            <div style={{
              display:  'flex',
              gap:      '14px',
              fontSize: '12px',
              color:    '#64748B',
              flexWrap: 'wrap',
            }}>
              <span>#{visit.id}</span>
              {visit.technicianName && (
                <span>🔧 {visit.technicianName}</span>
              )}
              {visit.entryOdometer && (
                <span>
                  🔢 {Number(visit.entryOdometer)
                    .toLocaleString('ar-IQ')} كم
                </span>
              )}
              <span>
                🛠 {(visit.services || []).length} خدمة
              </span>
            </div>
          </div>
        </div>

        {/* Left side: total + action */}
        <div style={{
          textAlign:  'left',
          flexShrink: 0,
        }}>
          {(visit.total || 0) > 0 && (
            <div style={{
              color:      '#F1F5F9',
              fontSize:   '18px',
              fontWeight: '700',
              marginBottom:'4px',
            }}>
              {Number(visit.total || 0)
                .toLocaleString('ar-IQ')} د.ع
            </div>
          )}
          <div style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '5px',
            background:   statusColor,
            borderRadius: '8px',
            padding:      '6px 14px',
            color:        '#fff',
            fontSize:     '12px',
            fontWeight:   '600',
          }}>
            متابعة الزيارة
            <ChevronLeft size={13} />
          </div>
        </div>

      </div>
    </div>
  );
}

const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Store actions/states
  const customers = useStore((state) => state.customers);
  const cars = useStore((state) => state.cars);
  const visits = useStore((state) => state.visits);
  const users = useStore((state) => state.users);
  const visitServices = useStore((state) => state.visitServices);
  const invoices = useStore((state) => state.invoices);
  const payments = useStore((state) => state.payments);
  const settings = useStore((state) => state.settings);
  const customerDocuments = useStore((state) => state.customerDocuments) || [];
  const currentUser = useStore((state) => state.currentUser);
  
  const updateCustomer = useStore((state) => state.updateCustomer);
  const addCar = useStore((state) => state.addCar);
  const updateCar = useStore((state) => state.updateCar);
  const deleteCar = useStore((state) => state.deleteCar);
  const addVisit = useStore((state) => state.addVisit);
  
  const addDocument = useStore((state) => state.addDocument);
  const deleteDocument = useStore((state) => state.deleteDocument);
  const addPayment = useStore((state) => state.addPayment);
  const markPaymentAsPaid = useStore((state) => state.markPaymentAsPaid);

  const customer = customers.find((c: Customer) => c.id === id);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'cars' | 'visits' | 'finance' | 'reminders' | 'docs' | 'analytics'>('cars');

  // Floating speed dial open
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Modals Open States
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [editingCarObj, setEditingCarObj] = useState<Car | null>(null);
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
  const [selectedCarForVisit, setSelectedCarForVisit] = useState<Car | null>(null);

  // Debt Payment States
  const [selectedPayForModal, setSelectedPayForModal] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState('');

  // Quick Account Debt Payment States
  const [isQuickPayOpen, setIsQuickPayOpen] = useState(false);
  const [quickPayAmount, setQuickPayAmount] = useState<number>(0);
  const [quickPayNotes, setQuickPayNotes] = useState('');

  // Edit Customer Fields
  const [custName, setCustName] = useState(customer?.name || '');
  const [custPhone, setCustPhone] = useState(customer?.phone || '');
  const [custAddress, setCustAddress] = useState(customer?.address || '');
  const [custNotes, setCustNotes] = useState(customer?.notes || '');
  const [custTagsStr, setCustTagsStr] = useState(customer?.tags?.join(', ') || '');

  // Add/Edit Car Fields
  const [carName, setCarName] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carYear, setCarYear] = useState(2022);
  const [carColor, setCarColor] = useState('أبيض');
  const [carColorHex, setCarColorHex] = useState('#ffffff');
  const [carCategory, setCarCategory] = useState<'Sedan' | 'SUV' | 'Pickup' | 'Van' | 'Luxury' | 'Other'>('Sedan');
  const [carPlate, setCarPlate] = useState('');
  const [carVIN, setCarVIN] = useState('');
  const [carOdometer, setCarOdometer] = useState<number>(0);
  const [carNotes, setCarNotes] = useState('');

  // Add Visit Fields
  const [visitCarId, setVisitCarId] = useState('');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [visitOdometer, setVisitOdometer] = useState<number>(0);
  const [visitTechId, setVisitTechId] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  // Timeline & visits filters
  const [filterCarId, setFilterCarId] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [filterServiceType, setFilterServiceType] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest'>('newest');

  // Documents
  const [docName, setDocName] = useState('');
  const [docVisitId, setDocVisitId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Next service alerts timeline view for cars
  const [selectedCarDetail, setSelectedCarDetail] = useState<Car | null>(null);

  // Quick Swatches for car colors
  const colorSwatches = [
    { name: 'أبيض', hex: '#ffffff' },
    { name: 'أسود', hex: '#000000' },
    { name: 'فضي', hex: '#d1d5db' },
    { name: 'رمادي', hex: '#4b5563' },
    { name: 'أحمر', hex: '#ef4444' },
    { name: 'أزرق', hex: '#3b82f6' },
    { name: 'كحلي', hex: '#1e3a8a' },
    { name: 'ذهبي', hex: '#f59e0b' }
  ];

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold font-cairo text-brand-text-light dark:text-brand-text-dark">الزبون غير موجود</h3>
        <button onClick={() => navigate('/customers')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold font-cairo">عودة لقائمة الزبائن</button>
      </div>
    );
  }

  // Filter lists
  const customerCars = cars.filter((c: Car) => c.customerId === customer.id);
  const customerVisits = visits.filter((v: Visit) => v.customerId === customer.id);
  const customerInvoices = invoices.filter((inv: Invoice) => customerVisits.some((v: Visit) => v.id === inv.visitId));
  const customerPayments = payments.filter((p: Payment) => p.customerId === customer.id);
  const customerDocs = customerDocuments.filter((d: CustomerDocument) => d.customerId === customer.id);
  const technicians = users.filter((u: AppUser) => u.role === 'technician' || u.role === 'admin');

  // Open = not delivered and not locked
  const openVisit = customerVisits.find(
    (v: Visit) =>
      (v.status === 'received' ||
       v.status === 'in_progress' ||
       v.status === 'استقبلت' ||
       v.status === 'منتظر' ||
       v.status === 'قيد الفحص' ||
       v.status === 'قيد التنفيذ' ||
       v.status === 'Open' ||
       v.status === 'In Progress') &&
      !v.isLocked
  );

  const openVisitCar = openVisit
    ? cars.find((c: Car) => c.id === openVisit.carId)
    : null;

  // Settle Full Debt Action
  const handlePayFullDebt = (pay: any) => {
    if (window.confirm(`هل أنت متأكد من تسديد الدين المتبقي بالكامل (${formatCurrencyLocal(pay.remainingAmount)}) لهذه الفاتورة؟`)) {
      markPaymentAsPaid(pay.visitId);
      toast.success('تم تسديد الدين بالكامل بنجاح ✓');
    }
  };

  // Settle Partial Debt Submit
  const handlePayPartialDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayForModal) return;

    if (payAmount <= 0) {
      toast.error('يرجى إدخال مبلغ أكبر من الصفر');
      return;
    }

    if (payAmount > selectedPayForModal.remainingAmount) {
      toast.error(`خطأ: المبلغ المدخل أكبر من المتبقي المتبقي (${formatCurrencyLocal(selectedPayForModal.remainingAmount)})`);
      return;
    }

    addPayment({
      visitId: selectedPayForModal.visitId,
      paidAmount: payAmount,
      method: 'cash',
      notes: payNotes || 'سداد دفعة جزئية من الدين عبر ملف العميل'
    });

    toast.success('تم تسجيل الدفعة الجزئية بنجاح ✓');
    setSelectedPayForModal(null);
    setPayAmount(0);
    setPayNotes('');
  };

  // Quick Account Debt Payment Submit
  const handleQuickPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPayAmount <= 0) {
      toast.error('يرجى إدخال مبلغ أكبر من الصفر');
      return;
    }

    if (quickPayAmount > totalDebt) {
      toast.error(`خطأ: المبلغ المدخل أكبر من إجمالي الديون المتبقية (${formatCurrencyLocal(totalDebt)})`);
      return;
    }

    // Get all outstanding visits for this customer sorted by entryDate (oldest first)
    const unpaidVisits = [...customerVisits]
      .filter((v: Visit) => v.invoiceIssued && (v.totalRemaining || 0) > 0)
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    let remainingAmountToPay = quickPayAmount;

    for (const v of unpaidVisits) {
      if (remainingAmountToPay <= 0) break;
      const visitRemaining = v.totalRemaining || 0;
      const paymentForVisit = Math.min(remainingAmountToPay, visitRemaining);

      addPayment({
        visitId: v.id,
        paidAmount: paymentForVisit,
        method: 'cash',
        notes: quickPayNotes || 'تسديد دفعة حساب سريعة (مجمعة) عبر ملف العميل'
      });

      remainingAmountToPay -= paymentForVisit;
    }

    toast.success('تم توزيع الدفعة على الفواتير المستحقة بنجاح ✓');
    setIsQuickPayOpen(false);
    setQuickPayAmount(0);
    setQuickPayNotes('');
  };

  // Calculate Date Gap Since Created
  const getCustomerMembershipDuration = (createdAtStr: string) => {
    const diffTime = Math.abs(Date.now() - new Date(createdAtStr).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `عميل منذ ${diffDays} يوم`;
    const months = Math.floor(diffDays / 30);
    const years = Math.floor(months / 12);
    if (years > 0) {
      const remainingMonths = months % 12;
      return `عميل منذ ${years} سنة و${remainingMonths} شهر`;
    }
    return `عميل منذ ${months} أشهر`;
  };

  // Spend math
  const totalInvoiced = customerInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total, 0);
  const totalPaid = customerPayments.reduce((sum: number, p: Payment) => sum + (p.paidAmount || 0), 0);
  const totalDebt = Math.max(0, totalInvoiced - totalPaid);

  const lastVisitDateStr = customerVisits.length > 0 
    ? [...customerVisits].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())[0].entryDate
    : null;

  // Save Customer Changes
  const handleUpdateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      toast.error('الاسم والهاتف مطلوبان');
      return;
    }
    const tags = custTagsStr.split(',').map((t: string) => t.trim()).filter(Boolean);
    updateCustomer(customer.id, {
      name: custName,
      phone: custPhone,
      address: custAddress,
      notes: custNotes,
      tags
    });
    toast.success('تم تحديث معلومات الزبون بنجاح');
    setIsEditCustomerOpen(false);
  };

  // Add/Edit Car Submit
  const handleCarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carName.trim() || !carBrand.trim() || !carPlate.trim() || carOdometer <= 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      return;
    }

    const carData = {
      customerId: customer.id,
      name: carName,
      brand: carBrand,
      year: carYear,
      color: carColor,
      colorHex: carColorHex,
      category: carCategory,
      plateNumber: carPlate,
      chassisNumber: carVIN,
      odometer: carOdometer,
      notes: carNotes
    };

    if (editingCarObj) {
      updateCar(editingCarObj.id, carData);
      toast.success('تم تعديل بيانات السيارة بنجاح');
    } else {
      addCar(carData);
      toast.success('تمت إضافة السيارة الجديدة بنجاح');
    }

    setIsAddCarOpen(false);
    setEditingCarObj(null);
    // Reset fields
    setCarName('');
    setCarBrand('');
    setCarPlate('');
    setCarVIN('');
    setCarOdometer(0);
    setCarNotes('');
  };

  const handleStartEditCar = (c: Car) => {
    setEditingCarObj(c);
    setCarName(c.name);
    setCarBrand(c.brand);
    setCarYear(c.year);
    setCarColor(c.color);
    setCarColorHex(c.colorHex || '#ffffff');
    setCarCategory(c.category);
    setCarPlate(c.plateNumber);
    setCarVIN(c.chassisNumber);
    setCarOdometer(c.odometer);
    setCarNotes(c.notes || '');
    setIsAddCarOpen(true);
  };

  // Add Visit
  const handleAddVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitCarId || !visitTechId || visitOdometer <= 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const selectedCar = cars.find((c: Car) => c.id === visitCarId);
    if (selectedCar && visitOdometer < selectedCar.odometer) {
      toast.warning('عداد المسافة المدخل أقل من العداد السابق للسيارة!');
    }

    const newVisitId = addVisit({
      customerId: customer.id,
      carId: visitCarId,
      technicianId: visitTechId,
      entryDate: visitDate,
      entryOdometer: visitOdometer,
      notes: visitNotes,
      operatorId: currentUser?.id
    });

    toast.success('تم استقبال السيارة وتسجيل الزيارة بنجاح');
    setIsAddVisitOpen(false);
    navigate(`/visits/${newVisitId}`);
  };

  const handleTriggerQuickVisit = (c: Car) => {
    setSelectedCarForVisit(c);
    setVisitCarId(c.id);
    setVisitOdometer(c.odometer);
    setIsAddVisitOpen(true);
  };

  // Uploader for attachments
  const handleUploadDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 10 * 1024 * 1024) {
      toast.error('الحد الأقصى لحجم الملف هو 10 ميغابايت!');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64Data = reader.result as string;
      addDocument({
        customerId: customer.id,
        visitId: docVisitId || undefined,
        name: docName || file.name,
        type: file.type.includes('pdf') ? 'pdf' : 'image',
        fileData: base64Data,
        uploadedBy: currentUser?.id || 'system'
      });
      toast.success('تم تحميل وحفظ الملف بنجاح');
      setDocName('');
      setDocVisitId('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
  };

  // Reminders Whatsapp copy template
  const getWhatsAppMessage = (reminder: any) => {
    let template = settings.whatsappTemplates?.general || '';
    if (reminder.serviceName.includes('زيت')) {
      template = settings.whatsappTemplates?.oil || '';
    }

    // replace tokens
    const text = template
      .replace('{customerName}', customer.name)
      .replace('{carName}', reminder.carName)
      .replace('{serviceName}', reminder.serviceName)
      .replace('{brand}', reminder.brand || 'معتمد')
      .replace('{viscosity}', reminder.viscosity || '')
      .replace('{dueKm}', reminder.dueKm ? reminder.dueKm.toLocaleString('ar-IQ') : '')
      .replace('{dueDate}', reminder.dueDate ? formatDateLocal(reminder.dueDate) : '')
      .replace('{centerPhone}', settings.phone);
    return text;
  };

  // Odometer timelines for Selected Car
  const odometerData = useMemo(() => {
    if (!selectedCarDetail) return [];
    const carVisits = visits.filter((v: Visit) => v.carId === selectedCarDetail.id);
    return carVisits
      .map((v: Visit) => ({
        date: formatDateLocal(v.entryDate),
        odometer: v.entryOdometer
      }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedCarDetail, visits]);

  // Analytics Math
  const categorySpending = useMemo(() => {
    const breakdown: Record<string, number> = {};
    const servicesInVisits = visitServices.filter((vs: VisitService) => customerVisits.some((v: Visit) => v.id === vs.visitId));
    servicesInVisits.forEach((vs: VisitService) => {
      const cat = vs.categoryName || 'أخرى';
      breakdown[cat] = (breakdown[cat] || 0) + vs.totalPrice;
    });
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  }, [customerVisits, visitServices]);

  const carSpending = useMemo(() => {
    const breakdown: Record<string, number> = {};
    const vsInInvoices = visitServices.filter((vs: VisitService) => customerVisits.some((v: Visit) => v.id === vs.visitId));
    customerCars.forEach((car: Car) => {
      const carVisits = customerVisits.filter((v: Visit) => v.carId === car.id);
      const sum = vsInInvoices
        .filter((vs: VisitService) => carVisits.some((v: Visit) => v.id === vs.visitId))
        .reduce((s: number, vs: VisitService) => s + vs.totalPrice, 0);
      breakdown[`${car.brand} ${car.name}`] = sum;
    });
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  }, [customerCars, customerVisits, visitServices]);

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6'];

  // Smart reminders calculation
  const smartReminders = useMemo(() => {
    const alerts: any[] = [];
    
    // Check next oil service odometer for each car
    customerCars.forEach((car: Car) => {
      const carServices = visitServices.filter((vs: VisitService) => {
        const v = customerVisits.find((vis: Visit) => vis.id === vs.visitId);
        return v && v.carId === car.id && vs.oilDetails?.nextChangeOdometer;
      });

      if (carServices.length > 0) {
        // Find latest oil service
        const latest = carServices.sort((a: VisitService, b: VisitService) => {
          const va = customerVisits.find((v: Visit) => v.id === a.visitId);
          const vb = customerVisits.find((v: Visit) => v.id === b.visitId);
          return new Date(vb!.entryDate).getTime() - new Date(va!.entryDate).getTime();
        })[0];

        const details = latest.oilDetails;
        if (details && details.nextChangeOdometer) {
          const nextKm = details.nextChangeOdometer;
          const currentKm = car.odometer;
          const diff = nextKm - currentKm;

          let urgency: 'red' | 'amber' | 'green' = 'green';
          let msg = '';

          if (diff <= 0) {
            urgency = 'red';
            msg = `تجاوز الموعد المحدد لتبديل الزيت بـ ${Math.abs(diff).toLocaleString('ar-IQ')} كم!`;
          } else if (diff < 1000) {
            urgency = 'amber';
            msg = `اقتراب موعد تغيير الزيت (متبقي ${diff.toLocaleString('ar-IQ')} كم)`;
          } else {
            msg = `تبديل الزيت القادم عند العداد ${nextKm.toLocaleString('ar-IQ')} كم (متبقي ${diff.toLocaleString('ar-IQ')} كم)`;
          }

          alerts.push({
            id: `oil-${car.id}`,
            carName: `${car.brand} ${car.name}`,
            serviceName: 'تغيير زيت المحرك',
            brand: details.brand,
            viscosity: details.viscosity,
            dueKm: nextKm,
            dueDate: details.nextChangeDate,
            urgency,
            message: msg
          });
        }
      }
    });

    return alerts;
  }, [customerCars, customerVisits, visitServices]);

  // Combined visits timeline filter
  const filteredVisits = useMemo(() => {
    let items = [...customerVisits];
    
    if (filterCarId) {
      items = items.filter((v: Visit) => v.carId === filterCarId);
    }
    
    if (filterPaymentStatus) {
      items = items.filter((v: Visit) => {
        const inv = invoices.find((i: Invoice) => i.visitId === v.id);
        if (!inv) return filterPaymentStatus === 'unpaid';
        const pm = payments.find((p: Payment) => p.invoiceId === inv.id);
        return pm?.status === filterPaymentStatus;
      });
    }

    // sort
    if (sortOrder === 'oldest') {
      items.sort((a: Visit, b: Visit) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
    } else if (sortOrder === 'highest') {
      items.sort((a: Visit, b: Visit) => {
        const invA = invoices.find((i: Invoice) => i.visitId === a.id)?.total || 0;
        const invB = invoices.find((i: Invoice) => i.visitId === b.id)?.total || 0;
        return invB - invA;
      });
    } else {
      // newest
      items.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    }

    return items;
  }, [customerVisits, filterCarId, filterPaymentStatus, invoices, payments, sortOrder]);

  return (
    <div className="space-y-6">
      
      {/* ================= 4.1 PROFILE HEADER CARD ================= */}
      <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Left Section (Hero identity) */}
        <div className="lg:col-span-2 flex flex-col md:flex-row gap-5 items-center md:items-start text-center md:text-right">
          {/* Initials circle */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-600/10" style={{ backgroundColor: customer.avatarColor || '#6366F1' }}>
            {getInitials(customer.name)}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-cairo leading-none">{customer.name}</h2>
              {openVisit && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" style={{ animation: 'pulse 1.2s infinite' }} />
                  في المركز حالياً
                </span>
              )}
              {customer.tags && customer.tags.map((t: string) => (
                <span key={t} className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-brand-accent-dark px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-cairo">
                  {t}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-slate-500 font-cairo">
              <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-indigo-600">
                <Phone className="w-3.5 h-3.5" />
                <span>{toArabicNumerals(customer.phone)}</span>
              </a>
              <a 
                href={`https://wa.me/${toLatinNumerals(customer.phone).replace(/^0/, '964')}`}
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>واتساب</span>
              </a>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>العنوان: {customer.address || 'غير محدد'}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 text-[10px] text-slate-400 font-cairo">
              <span>{getCustomerMembershipDuration(customer.createdAt)}</span>
              <span>•</span>
              <span>أضيف بواسطة موظف الاستقبال</span>
            </div>

            {/* Enhanced Customer Stats */}
            {(() => {
              const customerVisitsAll = visits.filter((v: any) => v.customerId === customer.id);
              const totalSpentStat = customerVisitsAll.reduce((sum: number, v: any) => sum + (v.total || 0), 0);
              const totalDebtStat = customerVisitsAll.reduce((sum: number, v: any) => sum + (v.totalRemaining || 0), 0);
              const openVisitsCount = customerVisitsAll.filter((v: any) => 
                v.status === 'received' || v.status === 'in_progress' || 
                v.status === 'منتظر' || v.status === 'استقبلت' || 
                v.status === 'قيد الفحص' || v.status === 'قيد التنفيذ' ||
                v.status === 'Open' || v.status === 'In Progress'
              ).length;
              const lastVisitStat = [...customerVisitsAll].sort(
                (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];
              const daysSince = lastVisitStat
                ? Math.floor((Date.now() - new Date(lastVisitStat.createdAt).getTime()) / 86400000)
                : null;

              return (
                <div className="flex flex-wrap gap-2 mt-3">
                  {openVisitsCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500" style={{ animation: 'pulse 1.5s infinite' }}></span>
                      {openVisitsCount} زيارة مفتوحة
                    </span>
                  )}
                  {totalDebtStat > 0 && (
                    <button
                      onClick={() => {
                        setActiveTab('finance');
                        setIsQuickPayOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:text-red-800 transition-all cursor-pointer active:scale-95 shadow-sm"
                      title="اضغط للسداد السريع للدين"
                    >
                      <span>⚠️ دين: {totalDebtStat.toLocaleString('ar-IQ')} د.ع</span>
                      <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold mr-1 font-cairo">سدد الآن</span>
                    </button>
                  )}
                  {daysSince !== null && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
                      🕐 آخر زيارة: منذ {daysSince} يوم
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    💰 إجمالي الإنفاق: {totalSpentStat.toLocaleString('ar-IQ')} د.ع
                  </span>
                </div>
              );
            })()}

            {customer.notes && (
              <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark inline-block text-right">
                <strong>ملاحظة عامة:</strong> {customer.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right Section (Mini stats strip) */}
        <div className="border border-brand-border-light dark:border-brand-border-dark rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/20 divide-y divide-brand-border-light dark:divide-brand-border-dark space-y-3">
          <div className="grid grid-cols-4 gap-1 text-center font-cairo pb-2">
            <div>
              <span className="text-base font-black text-indigo-600 dark:text-brand-accent-dark block">{toArabicNumerals(String(customerCars.length))}</span>
              <span className="text-[9px] text-slate-400">سيارات</span>
            </div>
            <div>
              <span className="text-base font-black text-indigo-600 dark:text-brand-accent-dark block">{toArabicNumerals(String(customerVisits.length))}</span>
              <span className="text-[9px] text-slate-400">زيارات</span>
            </div>
            <div>
              <span className="text-base font-black text-indigo-600 dark:text-brand-accent-dark block">{toArabicNumerals(String(customerInvoices.length))}</span>
              <span className="text-[9px] text-slate-400">فواتير</span>
            </div>
            <div>
              <span className="text-sm font-black text-slate-700 dark:text-slate-200 block truncate">{formatCurrencyLocal(totalInvoiced)}</span>
              <span className="text-[9px] text-slate-400">الإجمالي د.ع</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-cairo pt-2.5">
            <div>
              <span className="text-slate-400">آخر زيارة:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 mr-1.5">{lastVisitDateStr ? formatDateLocal(lastVisitDateStr) : 'لا يوجد'}</span>
            </div>
            <div>
              {totalDebt > 0 ? (
                <span className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-lg font-bold text-[10px]">
                  دين معلق: {formatCurrencyLocal(totalDebt)} 🔴
                </span>
              ) : (
                <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-bold text-[10px]">
                  لا توجد ديون معلقة ✅
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button 
              onClick={() => setIsEditCustomerOpen(true)}
              className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-brand-accent-dark font-bold font-cairo hover:underline p-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>تعديل بيانات الملف الشخصي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Open Visit Alert */}
      <OpenVisitAlert
        visit={openVisit}
        car={openVisitCar}
        onNavigate={navigate}
      />

      {/* ================= 4.2 CUSTOMER PROFILE TABS MENU ================= */}
      <div className="flex flex-wrap gap-2 border-b border-brand-border-light dark:border-brand-border-dark pb-px">
        {[
          { label: '🚗 السيارات المضافة', value: 'cars' },
          { label: '📋 سجل الزيارات التراكمي', value: 'visits' },
          { label: '💰 الحسابات والمالية', value: 'finance' },
          { label: '🔔 تذكيرات الصيانة الذكية', value: 'reminders' },
          { label: '📎 المرفقات والمستندات', value: 'docs' },
          { label: '📊 التحليلات والإحصائيات', value: 'analytics' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value as any);
              setSelectedCarDetail(null);
            }}
            className={`px-5 py-3 font-bold font-cairo text-xs border-b-2 transition-all leading-none ${
              activeTab === tab.value
                ? 'border-indigo-600 text-indigo-600 dark:border-brand-accent-dark dark:text-brand-accent-dark'
                : 'border-transparent text-brand-muted-light dark:text-brand-muted-dark hover:text-brand-text-light dark:hover:text-brand-text-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents Panel */}
      <div>
        <AnimatePresence mode="wait">
          
          {/* ================= TAB 1: CARS GRID ================= */}
          {activeTab === 'cars' && !selectedCarDetail && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              key="cars-grid"
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-cairo">
                  🚗 السيارات المسجلة للعميل ({customerCars.length})
                </h3>
                <button
                  onClick={() => {
                    setEditingCarObj(null);
                    setCarName('');
                    setCarBrand('');
                    setCarPlate('');
                    setCarVIN('');
                    setCarOdometer(0);
                    setCarNotes('');
                    setIsAddCarOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-cairo flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة سيارة جديدة</span>
                </button>
              </div>

              {customerCars.length === 0 ? (
                <EmptyState
                  title="لا توجد سيارات مضافة بعد"
                  description="يرجى إضافة سيارة واحدة على الأقل لهذا العميل لتتمكن من تسجيل زيارات الصيانة وإصدار الفواتير لها."
                  icon={<CarIcon className="w-8 h-8" />}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customerCars.map((car: Car) => {
                    const carVisitsCount = visits.filter((v: Visit) => v.carId === car.id).length;
                    return (
                      <div 
                        key={car.id} 
                        className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-5 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-shadow"
                      >
                        {/* Car identity details */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300">
                              <CarIcon className="w-5 h-5" />
                            </div>
                            <div className="cursor-pointer" onClick={() => navigate(`/cars/${car.id}`)}>
                              <h4 className="font-black text-sm font-cairo text-slate-800 dark:text-slate-100 leading-none hover:text-indigo-600 dark:hover:text-brand-accent-dark transition-colors">
                                {car.brand} {car.name}
                              </h4>
                              <span className="text-[10px] text-slate-400 mt-1 block">سنة الصنع: {toArabicNumerals(String(car.year))} | {car.category}</span>
                            </div>
                          </div>

                          {/* Plate graphic */}
                          <div className="border border-slate-300 dark:border-slate-700 bg-white rounded-lg flex items-stretch overflow-hidden text-[10px] font-black shadow-sm h-7 select-none">
                            <div className="bg-blue-600 text-white w-2.5 flex items-center justify-center font-sans text-[7px]">IQ</div>
                            <div className="px-2 flex items-center justify-center text-slate-800 font-mono tracking-tight text-[11px]">{toArabicNumerals(car.plateNumber)}</div>
                          </div>
                        </div>

                        {/* Odometer and Specs */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl text-center text-[10px] font-cairo">
                          <div>
                            <span className="text-slate-400 block mb-1">العداد الحالي</span>
                            <strong className="text-slate-700 dark:text-slate-300">{toArabicNumerals(car.odometer.toLocaleString('en-US'))} كم</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-1">الزيارات</span>
                            <strong className="text-slate-700 dark:text-slate-300">{toArabicNumerals(String(carVisitsCount))} زيارة</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-1">اللون</span>
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: car.colorHex }} />
                              <strong className="text-slate-700 dark:text-slate-300">{car.color}</strong>
                            </div>
                          </div>
                        </div>

                        {/* VIN number */}
                        <div className="flex justify-between items-center text-[10px] font-cairo bg-slate-100/50 dark:bg-slate-900/20 px-3 py-2 rounded-xl">
                          <span className="text-slate-400">رقم الهيكل (VIN)</span>
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                            <span>{car.chassisNumber || 'غير محدد'}</span>
                            {car.chassisNumber && (
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(car.chassisNumber);
                                  toast.success('تم نسخ رقم الهيكل للحافظة');
                                }}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-brand-border-light dark:border-brand-border-dark">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedCarDetail(car)}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold font-cairo transition-all"
                            >
                              عرض المخطط والضمان
                            </button>
                            <button
                              onClick={() => navigate(`/cars/${car.id}`)}
                              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-brand-accent-dark rounded-xl text-[10px] font-bold font-cairo transition-all"
                            >
                              الفحوصات الفنية والملف الفني 📋
                            </button>
                            <button
                              onClick={() => handleStartEditCar(car)}
                              className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-[10px] font-bold text-indigo-600 dark:text-brand-accent-dark font-cairo transition-all"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('هل أنت متأكد من حذف هذه السيارة؟ سيتم إزالة ملف السيارة بالكامل!')) {
                                  deleteCar(car.id);
                                  toast.success('تم حذف السيارة بنجاح');
                                }
                              }}
                              className="px-3 py-1.5 hover:bg-red-50 rounded-xl text-[10px] font-bold text-red-500 font-cairo transition-all"
                            >
                              حذف
                            </button>
                          </div>

                          <button
                            onClick={() => handleTriggerQuickVisit(car)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold font-cairo flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>أضف زيارة صيانة</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ================= CAR DETAILS TIMELINE CHART AND SERVICE ALERT SUBVIEW ================= */}
          {activeTab === 'cars' && selectedCarDetail && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              key="car-timeline"
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setSelectedCarDetail(null)}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-brand-accent-dark font-bold font-cairo hover:underline"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الرجوع لشبكة السيارات</span>
                </button>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-cairo">
                  مخطط تطور عداد المسافات والتذكيرات لـ {selectedCarDetail.brand} {selectedCarDetail.name}
                </h3>
              </div>

              {/* Reminders Urgency Alert boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-cairo">
                {smartReminders
                  .filter(r => r.carName.includes(selectedCarDetail.name))
                  .map(rem => (
                    <div 
                      key={rem.id} 
                      className={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm ${
                        rem.urgency === 'red' ? 'bg-red-50 border-red-200 text-red-800' :
                        rem.urgency === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                        'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <div className="space-y-1">
                        <strong className="text-xs block font-bold">{rem.serviceName}</strong>
                        <p className="text-[10px] leading-relaxed">{rem.message}</p>
                        {rem.dueDate && <span className="text-[9px] block opacity-80">الموعد المحدد: {formatDateLocal(rem.dueDate)}</span>}
                      </div>
                    </div>
                  ))}

                {smartReminders.filter(r => r.carName.includes(selectedCarDetail.name)).length === 0 && (
                  <div className="col-span-3 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold font-cairo">جميع تذكيرات الصيانة لزيوت وفلاتر السيارة سليمة وبعيدة عن الموعد!</span>
                  </div>
                )}
              </div>

              {/* Timeline chart */}
              <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-cairo">📈 منحنى تزايد قراءة عداد المسافات عبر زيارات الصيانة</span>
                {odometerData.length < 2 ? (
                  <div className="py-10 text-center text-xs text-slate-400 font-cairo">يرجى تسجيل زيارتين على الأقل للسيارة لتوليد مخطط العداد البياني.</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={odometerData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="odometer" stroke="#6366F1" strokeWidth={3} name="قراءة العداد (كم)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ================= TAB 2: VISITS TIMELINE ================= */}
          {activeTab === 'visits' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              key="visits-timeline"
              className="space-y-6 w-full"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-cairo">
                  📋 سجل الزيارات التراكمي للعميل
                </h3>
                <button
                  onClick={() => setIsAddVisitOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-cairo flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>فتح زيارة جديدة</span>
                </button>
              </div>
              <CustomerVisitsTab customerId={customer.id} onAddVisit={() => setIsAddVisitOpen(true)} />
            </motion.div>
          )}

          {/* ================= TAB 3: FINANCIAL PANELS ================= */}
          {activeTab === 'finance' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: -15 }}
              key="finance-panel"
              className="space-y-6"
            >
              {/* Financial summary blocks */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-sm text-center space-y-2">
                  <span className="text-xs text-slate-400 block font-cairo">إجمالي المستحق (Billed)</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">{formatCurrencyLocal(totalInvoiced)}</span>
                </div>
                <div className="p-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-sm text-center space-y-2">
                  <span className="text-xs text-slate-400 block font-cairo">إجمالي المسدد (Paid)</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrencyLocal(totalPaid)}</span>
                </div>
                <div className="p-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-sm text-center flex flex-col justify-between items-center space-y-2">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 block font-cairo">الديون والذمم المؤجلة</span>
                    <span className="text-xl font-black text-red-600 dark:text-red-400 font-mono">{formatCurrencyLocal(totalDebt)}</span>
                  </div>
                  {totalDebt > 0 && (
                    <button
                      onClick={() => setIsQuickPayOpen(true)}
                      className="mt-2 w-full py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg font-cairo transition-all active:scale-95 shadow-sm shadow-red-600/10"
                    >
                      💳 سداد سريع للديون
                    </button>
                  )}
                </div>
                <div className="p-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-sm text-center space-y-2">
                  <span className="text-xs text-slate-400 block font-cairo">متوسط قيمة الزيارة</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-brand-accent-dark font-mono">
                    {formatCurrencyLocal(customerVisits.length > 0 ? Math.round(totalInvoiced / customerVisits.length) : 0)}
                  </span>
                </div>
              </div>

              {/* Invoices table list */}
              <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-cairo">📋 قائمة الفواتير الصادرة للعميل ({customerInvoices.length})</span>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs font-cairo">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="p-3">رقم الفاتورة</th>
                        <th className="p-3">تاريخ الإصدار</th>
                        <th className="p-3">السيارة</th>
                        <th className="p-3">إجمالي الفاتورة</th>
                        <th className="p-3">حالة الدفع</th>
                        <th className="p-3">متبقي دين</th>
                        <th className="p-3 text-center">العمليات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border-light dark:divide-brand-border-dark">
                      {customerInvoices.map((inv: Invoice) => {
                        const v = visits.find((vis: Visit) => vis.id === inv.visitId);
                        const c = cars.find((car: Car) => car.id === v?.carId);
                        const pay = payments.find((p: Payment) => p.invoiceId === inv.id);

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                            <td className="p-3 font-mono font-bold">{inv.invoiceNumber}</td>
                            <td className="p-3">{formatDateLocal(inv.issuedAt)}</td>
                            <td className="p-3">{c ? `${c.brand} ${c.name}` : 'محذوفة'}</td>
                            <td className="p-3 font-bold">{formatCurrencyLocal(inv.total)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                                pay?.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                pay?.status === 'partial' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'
                              }`}>
                                {pay?.status === 'paid' ? '✓ مدفوعة بالكامل' : pay?.status === 'partial' ? 'سداد جزئي' : 'آجل بالكامل'}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-red-600 dark:text-red-400">{pay ? formatCurrencyLocal(pay.remainingAmount) : '-'}</td>
                            <td className="p-3 text-center">
                              {pay && pay.remainingAmount > 0 && (
                                <div className="flex items-center gap-1.5 justify-center">
                                  <button
                                    onClick={() => handlePayFullDebt(pay)}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95"
                                  >
                                    تسديد كامل
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedPayForModal(pay);
                                      setPayAmount(pay.remainingAmount);
                                      setPayNotes('');
                                    }}
                                    className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border transition-all active:scale-95"
                                  >
                                    دفعة جزئية
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= TAB 4: SMART REMINDERS ================= */}
          {activeTab === 'reminders' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: -15 }}
              key="reminders-panel"
              className="space-y-6 text-right font-cairo"
            >
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-brand-border-light dark:border-brand-border-dark pb-3">
                🔔 تذكيرات ومواعيد الصيانة الذكية للعميل
              </h3>

              {smartReminders.length === 0 ? (
                <EmptyState
                  title="لا توجد تنبيهات عاجلة"
                  description="لم تصل أي سيارة من سيارات العميل لميعاد تبديل الزيت أو الصيانة المجدولة حالياً."
                  icon={<Bell className="w-8 h-8" />}
                />
              ) : (
                <div className="space-y-4">
                  {smartReminders.map((rem) => (
                    <div 
                      key={rem.id}
                      className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white dark:bg-brand-surface-dark ${
                        rem.urgency === 'red' ? 'border-red-200 shadow-red-500/5' : 'border-amber-200 shadow-amber-500/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rem.urgency === 'red' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-bold text-slate-800 dark:text-slate-100">{rem.carName} — {rem.serviceName}</strong>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${rem.urgency === 'red' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                              {rem.urgency === 'red' ? 'عاجل جداً' : 'قريباً'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">{rem.message}</p>
                          {rem.dueDate && <span className="text-[9px] block text-slate-400">التاريخ المحدد: {formatDateLocal(rem.dueDate)}</span>}
                        </div>
                      </div>

                      {/* WhatsApp trigger messaging */}
                      <div className="flex items-center gap-2 self-end md:self-auto text-xs font-bold">
                        <button
                          onClick={() => {
                            const msg = getWhatsAppMessage(rem);
                            navigator.clipboard.writeText(msg);
                            toast.success('تم نسخ رسالة تذكير صيانة العميل للحافظة');
                          }}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الرسالة</span>
                        </button>
                        
                        <a 
                          href={`https://wa.me/${toLatinNumerals(customer.phone).replace(/^0/, '964')}?text=${encodeURIComponent(getWhatsAppMessage(rem))}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال واتساب</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ================= TAB 5: DOCUMENTS UPLOADER ================= */}
          {activeTab === 'docs' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: -15 }}
              key="docs-panel"
              className="space-y-6 text-right font-cairo"
            >
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-brand-border-light dark:border-brand-border-dark pb-3">
                📎 المرفقات ومستندات العميل والزيارات
              </h3>

              {/* Uploader tools widget */}
              <div className="border border-dashed border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/30 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">تحميل مستند أو صورة للمركبة</span>
                  <span className="text-[9px] text-slate-400 block">يقبل صيغ JPG, PNG, PDF لغاية 10 ميغابايت كحد أقصى للملف الواحد.</span>
                </div>
                
                <div>
                  <input
                    type="text"
                    placeholder="اسم المرفق (مثال: فحص محرك)"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-brand-surface-dark rounded-xl text-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={docVisitId}
                    onChange={(e) => setDocVisitId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-brand-surface-dark rounded-xl text-xs"
                  >
                    <option value="">مرفق عام (ملف العميل)</option>
                    {customerVisits.map((v: Visit) => {
                      const c = cars.find((car: Car) => car.id === v.carId);
                      return <option key={v.id} value={v.id}>زيارة {c?.brand} {c?.name} ({formatDateLocal(v.entryDate)})</option>;
                    })}
                  </select>

                  <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>تحميل ملف</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.png,.jpeg,.pdf"
                      onChange={handleUploadDocument}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Attachments grid */}
              {customerDocs.length === 0 ? (
                <EmptyState
                  title="لا توجد مرفقات حالياً"
                  description="يمكنك تحميل صور أضرار الهيكل، أو عقود صيانة، أو تقارير الفحص والـ PDF وتخزينها بأمان هنا."
                  icon={<Paperclip className="w-8 h-8" />}
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {customerDocs.map((doc: CustomerDocument) => (
                    <div 
                      key={doc.id} 
                      className="border border-brand-border-light dark:border-brand-border-dark rounded-2xl bg-white dark:bg-brand-surface-dark overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      {/* Image preview or PDF placeholder */}
                      <div className="h-28 bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden border-b border-brand-border-light dark:border-brand-border-dark">
                        {doc.type === 'pdf' ? (
                          <div className="text-center space-y-1">
                            <FileText className="w-8 h-8 text-indigo-500 mx-auto" />
                            <span className="text-[8.5px] text-slate-400 block font-mono">PDF DOCUMENT</span>
                          </div>
                        ) : (
                          <img src={doc.fileData} alt={doc.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">{doc.name}</strong>
                        <span className="text-[8.5px] text-slate-400 block">{formatDateLocal(doc.uploadedAt)}</span>
                      </div>
                      <div className="flex border-t border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900/40 p-2 justify-between">
                        <a 
                          href={doc.fileData} 
                          download={doc.name}
                          className="text-indigo-600 text-[10px] font-bold hover:underline"
                        >
                          تحميل
                        </a>
                        <button
                          onClick={() => {
                            if (confirm('تأكيد حذف هذا المرفق نهائياً؟')) {
                              deleteDocument(doc.id);
                              toast.success('تم حذف المرفق');
                            }
                          }}
                          className="text-red-500 text-[10px] hover:underline"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ================= TAB 6: ANALYTICS ================= */}
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: -15 }}
              key="analytics-panel"
              className="space-y-6"
            >
              {/* Spend breakdown charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Spending per Category */}
                <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-cairo block text-right">
                    🍕 توزيع مبالغ الصيانة حسب فئة الخدمة المقدمة
                  </span>
                  {categorySpending.length === 0 ? (
                    <div className="h-60 flex items-center justify-center text-xs text-slate-400 font-cairo">لا تتوفر فواتير صيانة منجزة للعميل.</div>
                  ) : (
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categorySpending}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(props: any) => `${props.name || ''} (${((props.percent || 0) * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categorySpending.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Spending per Car */}
                <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-cairo block text-right">
                    📊 مقارنة مبالغ الصيانة التراكمية لكل سيارة من سيارات العميل
                  </span>
                  {carSpending.length === 0 ? (
                    <div className="h-60 flex items-center justify-center text-xs text-slate-400 font-cairo">لا توجد بيانات مقارنة لسيارات العميل.</div>
                  ) : (
                    <div className="h-60 font-sans text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={carSpending}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#4f46e5" name="المصروف الكلي (د.ع)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Spending details box */}
              <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 font-cairo text-right">
                <div className="p-3 border border-brand-border-light dark:border-brand-border-dark rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-1">الخدمة الأكثر طلباً</span>
                  <strong className="text-xs text-slate-800 dark:text-slate-200 font-bold block">تغيير زيت محرك</strong>
                </div>
                <div className="p-3 border border-brand-border-light dark:border-brand-border-dark rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-1">السيارة الأكثر حركة صيانة</span>
                  <strong className="text-xs text-slate-800 dark:text-slate-200 font-bold block">
                    {customerCars.length > 0 ? `${customerCars[0].brand} ${customerCars[0].name}` : 'لا يوجد'}
                  </strong>
                </div>
                <div className="p-3 border border-brand-border-light dark:border-brand-border-dark rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-1">متوسط الفجوة الزمنية للزيارات</span>
                  <strong className="text-xs text-slate-800 dark:text-slate-200 font-bold block">٢٣ يوم تقريباً</strong>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ================= 4.3 CUSTOMER QUICK ACTIONS (FLOATING SPEED DIAL) ================= */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
          className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors focus:outline-none"
        >
          <Plus className={`w-6 h-6 transition-transform duration-200 ${speedDialOpen ? 'rotate-45' : ''}`} />
        </button>

        <AnimatePresence>
          {speedDialOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-14 right-0 flex flex-col gap-2 w-48 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark shadow-xl rounded-xl p-2 text-right text-xs font-bold font-cairo"
            >
              <button 
                onClick={() => {
                  setSpeedDialOpen(false);
                  if (customerCars.length === 0) {
                    toast.warning('يرجى تسجيل سيارة واحدة للعميل أولاً!');
                    return;
                  }
                  setVisitCarId(customerCars[0].id);
                  setVisitOdometer(customerCars[0].odometer);
                  setIsAddVisitOpen(true);
                }} 
                className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center justify-between"
              >
                <span>➕ زيارة صيانة جديدة</span>
              </button>
              
              <a 
                href={`tel:${customer.phone}`}
                className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center justify-between"
              >
                <span>📞 اتصال هاتفي</span>
              </a>

              <a 
                href={`https://wa.me/${toLatinNumerals(customer.phone).replace(/^0/, '964')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-between"
              >
                <span>💬 محادثة واتساب</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ================= MODALS ================= */}

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditCustomerOpen}
        onClose={() => setIsEditCustomerOpen(false)}
        title="تعديل معلومات الملف الشخصي للزبون"
      >
        <form onSubmit={handleUpdateCustomerSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">اسم الزبون الكامل *</label>
            <input
              type="text"
              required
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">رقم الهاتف للزبون *</label>
            <input
              type="text"
              required
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100 text-left"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">عنوان السكن</label>
            <input
              type="text"
              value={custAddress}
              onChange={(e) => setCustAddress(e.target.value)}
              className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">الوسوم والتصنيفات (تفصل بفارصة ,)</label>
            <input
              type="text"
              value={custTagsStr}
              onChange={(e) => setCustTagsStr(e.target.value)}
              placeholder="مثال: مميز , VIP , ذو أولوية"
              className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">ملاحظات العميل الخاصة</label>
            <textarea
              value={custNotes}
              onChange={(e) => setCustNotes(e.target.value)}
              rows={3}
              className="w-full p-3 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-brand-border-light dark:border-brand-border-dark">
            <button
              type="button"
              onClick={() => setIsEditCustomerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold font-cairo text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold font-cairo bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              حفظ
            </button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Car Modal */}
      <Modal
        isOpen={isAddCarOpen}
        onClose={() => {
          setIsAddCarOpen(false);
          setEditingCarObj(null);
        }}
        title={editingCarObj ? 'تعديل مواصفات وبيانات السيارة' : 'تسجيل وإضافة سيارة جديدة للزبون'}
      >
        <form onSubmit={handleCarSubmit} className="space-y-4 text-right overflow-y-auto max-h-[80vh] p-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">ماركة السيارة *</label>
              <input
                type="text"
                required
                value={carBrand}
                onChange={(e) => setCarBrand(e.target.value)}
                placeholder="تويوتا، هيونداي..."
                className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">اسم الموديل *</label>
              <input
                type="text"
                required
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                placeholder="كامري، توسان..."
                className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">سنة الصنع *</label>
              <input
                type="number"
                required
                min="1950"
                max={new Date().getFullYear() + 1}
                value={carYear}
                onChange={(e) => setCarYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-center font-bold text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">هيكل السيارة</label>
              <select
                value={carCategory}
                onChange={(e) => setCarCategory(e.target.value as any)}
                className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100"
              >
                <option value="Sedan">Sedan (صالون)</option>
                <option value="SUV">SUV (جيب عائلي)</option>
                <option value="Pickup">Pickup (بيك أب)</option>
                <option value="Van">Van (باص)</option>
                <option value="Luxury">Luxury (رياضي/فارهة)</option>
                <option value="Other">Other (أخرى)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">عداد قراءة العداد *</label>
              <input
                type="number"
                required
                min="1"
                value={carOdometer}
                onChange={(e) => setCarOdometer(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-center font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">رقم اللوحة المرورية *</label>
              <input
                type="text"
                required
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
                placeholder="بغداد - 12345 أ"
                className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100 text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">رقم شاسيه السيارة (VIN)</label>
              <input
                type="text"
                value={carVIN}
                onChange={(e) => setCarVIN(e.target.value)}
                placeholder="رقم الهيكل المكون من 17 حرفاً"
                className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-center font-mono text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">لون طلاء السيارة</label>
              <input
                type="text"
                value={carColor}
                onChange={(e) => setCarColor(e.target.value)}
                className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">اللون البياني (Color Swatch)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={carColorHex}
                  onChange={(e) => setCarColorHex(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <div className="flex flex-wrap gap-1">
                  {colorSwatches.map(sw => (
                    <button
                      key={sw.name}
                      type="button"
                      onClick={() => {
                        setCarColor(sw.name);
                        setCarColorHex(sw.hex);
                      }}
                      className="w-4 h-4 rounded-full border border-slate-300 shadow-sm"
                      style={{ backgroundColor: sw.hex }}
                      title={sw.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">ملاحظات فنية للسيارة</label>
            <textarea
              value={carNotes}
              onChange={(e) => setCarNotes(e.target.value)}
              rows={2}
              className="w-full p-3 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-brand-border-light dark:border-brand-border-dark">
            <button
              type="button"
              onClick={() => {
                setIsAddCarOpen(false);
                setEditingCarObj(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold font-cairo text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold font-cairo bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {editingCarObj ? 'تعديل السيارة' : 'تسجيل السيارة'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Visit Modal */}
      <Modal
        isOpen={isAddVisitOpen}
        onClose={() => setIsAddVisitOpen(false)}
        title={selectedCarForVisit ? `استقبال سيارة ${selectedCarForVisit.brand} ${selectedCarForVisit.name}` : 'تسجيل استقبال زيارة صيانة جديدة'}
      >
        <form onSubmit={handleAddVisitSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">السيارة المصانة *</label>
            <select
              value={visitCarId}
              onChange={(e) => {
                setVisitCarId(e.target.value);
                const matched = cars.find((car: Car) => car.id === e.target.value);
                if (matched) setVisitOdometer(matched.odometer);
              }}
              className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100"
              disabled={!!selectedCarForVisit}
            >
              {customerCars.map((c: Car) => (
                <option key={c.id} value={c.id}>{c.brand} {c.name} ({c.plateNumber})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">تاريخ الزيارة والدخول *</label>
              <input
                type="date"
                required
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-center font-mono text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">عداد المسافة عند الدخول (كم) *</label>
              <input
                type="number"
                required
                min="1"
                value={visitOdometer}
                onChange={(e) => setVisitOdometer(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-center font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">الفني المسؤول عن الفحص والصيانة *</label>
            <select
              required
              value={visitTechId}
              onChange={(e) => setVisitTechId(e.target.value)}
              className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100"
            >
              <option value="">اختر الفني المسؤول...</option>
              {technicians.map((t: AppUser) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 font-cairo">شكوى العميل / ملاحظات الاستقبال الأولية</label>
            <textarea
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              rows={3}
              placeholder="مثال: يشتكي من ضعف المكيف وصوت طقطقة بالدوران اليسار..."
              className="w-full p-3 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-brand-border-light dark:border-brand-border-dark">
            <button
              type="button"
              onClick={() => setIsAddVisitOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold font-cairo text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold font-cairo bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              بدء فحص وصيانة السيارة
            </button>
          </div>
        </form>
      </Modal>

      {/* Partial Debt Payment Modal */}
      {selectedPayForModal && (
        <Modal
          isOpen={!!selectedPayForModal}
          onClose={() => setSelectedPayForModal(null)}
          title="سداد دفعة جزئية من الدين"
        >
          <form onSubmit={handlePayPartialDebtSubmit} className="space-y-4 text-right font-cairo">
            <div>
              <p className="text-xs text-slate-500 mb-2">
                سداد دفعة للفاتورة رقم: <span className="font-mono font-bold text-slate-800 dark:text-slate-100">#{selectedPayForModal.invoiceId?.replace('inv-', '') || ''}</span>
              </p>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border text-xs">
                <div>
                  <span className="text-slate-400 block">إجمالي الدين المتبقي:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{formatCurrencyLocal(selectedPayForModal.remainingAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">إجمالي الفاتورة:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrencyLocal(selectedPayForModal.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-2">قيمة الدفعة المسددة حالياً *</label>
              <input
                type="number"
                required
                min="1"
                max={selectedPayForModal.remainingAmount}
                value={payAmount || ''}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-right font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-2">ملاحظات الدفع</label>
              <textarea
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                rows={2}
                placeholder="سداد جزء من الحساب معلق..."
                className="w-full p-3 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100 focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-brand-border-light dark:border-brand-border-dark">
              <button
                type="button"
                onClick={() => setSelectedPayForModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                حفظ الدفعة
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Quick Debt Payment Modal */}
      {isQuickPayOpen && (
        <Modal
          isOpen={isQuickPayOpen}
          onClose={() => setIsQuickPayOpen(false)}
          title="سداد سريع للديون المتراكمة"
        >
          <form onSubmit={handleQuickPaySubmit} className="space-y-4 text-right font-cairo">
            <div>
              <p className="text-xs text-slate-500 mb-2">
                تقوم هذه العملية بتسديد المبلغ المدخل وتوزيعه تلقائياً على الفواتير المستحقة للزبون بدءاً من الأقدم.
              </p>
              <div className="grid grid-cols-1 gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border text-xs">
                <div>
                  <span className="text-slate-400 block">إجمالي الديون المعلقة على الزبون:</span>
                  <span className="font-bold text-red-600 dark:text-red-400 text-sm">{formatCurrencyLocal(totalDebt)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-2">قيمة المبلغ المسدد حالياً *</label>
              <input
                type="number"
                required
                min="1"
                max={totalDebt}
                value={quickPayAmount || ''}
                onChange={(e) => setQuickPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-right font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-2">ملاحظات الدفع</label>
              <textarea
                value={quickPayNotes}
                onChange={(e) => setQuickPayNotes(e.target.value)}
                rows={2}
                placeholder="سداد حساب مجمع للعميل..."
                className="w-full p-3 border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-cairo text-slate-800 dark:text-slate-100 focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-brand-border-light dark:border-brand-border-dark">
              <button
                type="button"
                onClick={() => setIsQuickPayOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                تأكيد وتوزيع الدفعة
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default CustomerProfile;
