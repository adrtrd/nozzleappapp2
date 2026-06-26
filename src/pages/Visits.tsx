import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Eye, 
  ClipboardList, 
  X,
  User,
  Car as CarIcon,
  Calendar,
  Compass,
  ArrowUpRight,
  Filter,
  CheckCircle,
  Clock,
  Ban,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  AlertTriangle,
  Printer,
  Send,
  Check,
  DollarSign,
  AlertCircle,
  Sparkles,
  Camera,
  Activity,
  UserPlus,
  Trash2
} from 'lucide-react';
import { useStore, VisitStatus, Customer, Car, User as StoreUser, Visit, Invoice, VisitService, Payment } from '../store/store';
import { toast } from '../store/toastStore';
import { formatDate, formatCurrency } from './Dashboard';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const KANBAN_STATUSES: VisitStatus[] = ['منتظر', 'استقبلت', 'قيد الفحص', 'قيد التنفيذ', 'انتهت', 'سُلّمت'];

const getColumnStatusColor = (status: VisitStatus) => {
  switch (status) {
    case 'منتظر': return 'bg-blue-500';
    case 'استقبلت': return 'bg-purple-500';
    case 'قيد الفحص': return 'bg-yellow-500';
    case 'قيد التنفيذ': return 'bg-orange-500';
    case 'انتهت': return 'bg-green-500';
    case 'سُلّمت': return 'bg-emerald-500';
    default: return 'bg-slate-500';
  }
};

const Visits: React.FC = () => {
  const navigate = useNavigate();

  // Store actions/states
  const visits = useStore((state) => state.visits);
  const customers = useStore((state) => state.customers);
  const cars = useStore((state) => state.cars);
  const users = useStore((state) => state.users);
  const visitServices = useStore((state) => state.visitServices);
  const invoices = useStore((state) => state.invoices);
  const payments = useStore((state) => state.payments);
  const settings = useStore((state) => state.settings);
  const addVisit = useStore((state) => state.addVisit);
  const updateVisit = useStore((state) => state.updateVisit);
  const addCustomer = useStore((state) => state.addCustomer);
  const addCar = useStore((state) => state.addCar);

  // Layout View States
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'calendar'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | VisitStatus>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewVisitOpen, setIsNewVisitOpen] = useState(false);

  // New Visit Form Fields (Wizard State)
  const [wizardStep, setWizardStep] = useState(1); // 1: Customer & Car, 2: Reception Details, 3: Confirmation
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [visitOdometer, setVisitOdometer] = useState<number>(0);
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
    // Return YYYY-MM-DD
    return d.toISOString().split('T')[0];
  });
  const [visitTime, setVisitTime] = useState(() => {
    const d = new Date();
    return d.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
  });
  const [visitTechId, setVisitTechId] = useState('');
  const [visitPriority, setVisitPriority] = useState<'normal' | 'urgent' | 'vip'>('normal');
  const [customerComplaint, setCustomerComplaint] = useState('');
  const [receptionNotes, setReceptionNotes] = useState('');
  
  // Mock image state
  const [receptionPhotos, setReceptionPhotos] = useState<{ url: string; uploadedAt: string }[]>([]);
  const [imageInputUrl, setImageInputUrl] = useState('');

  // Print & WhatsApp options on Confirmation step
  const [printSlipOption, setPrintSlipOption] = useState(true);
  const [whatsappOption, setWhatsappOption] = useState(true);

  // Quick Customer Registration State (Step 1)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');
  const [quickCustAddress, setQuickCustAddress] = useState('');
  const [quickCarName, setQuickCarName] = useState('');
  const [quickCarBrand, setQuickCarBrand] = useState('');
  const [quickCarYear, setQuickCarYear] = useState<number>(new Date().getFullYear());
  const [quickCarPlate, setQuickCarPlate] = useState('');
  const [quickCarColor, setQuickCarColor] = useState('أبيض');
  const [quickCarOdometer, setQuickCarOdometer] = useState<number>(0);

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);

  // Calendar States
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Search state inside customer selection list (Step 1)
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') {
      setIsNewVisitOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Filtered lists
  const filteredCustomers = customers.filter((c: Customer) => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  const customerCars = cars.filter((c: Car) => c.customerId === selectedCustomerId);
  const technicians = users.filter((u: StoreUser) => u.role === 'technician' || u.role === 'admin');

  // Filter visits by search query (customer name or phone) and status
  const filteredVisits = visits.filter((v: Visit) => {
    const cust = customers.find((c: Customer) => c.id === v.customerId);
    const matchesSearch = cust 
      ? cust.name.toLowerCase().includes(searchQuery.toLowerCase()) || cust.phone.includes(searchQuery)
      : false;
    
    const matchesStatus = statusFilter === 'All' ? true : v.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);
  const paginatedVisits = filteredVisits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate Customer Debts
  const getCustomerDebts = (customerId: string) => {
    return payments
      .filter((p: Payment) => p.customerId === customerId && p.status !== 'paid')
      .reduce((sum: number, p: Payment) => sum + (p.remainingAmount || 0), 0);
  };

  // Get Last Visit Badge
  const getCustomerLastVisit = (customerId: string) => {
    const custVisits = visits
      .filter((v: Visit) => v.customerId === customerId)
      .sort((a: Visit, b: Visit) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    return custVisits.length > 0 ? custVisits[0].entryDate : null;
  };

  // Check for warnings/pending services for selected vehicle
  const getCarWarnings = () => {
    if (!selectedCarId) return [];
    const car = cars.find((c: Car) => c.id === selectedCarId);
    if (!car) return [];

    const warnings: string[] = [];

    // Find services with nextChangeOdometer
    const servicesWithMilestone = visitServices.filter((vs: VisitService) => {
      const visit = visits.find((v: Visit) => v.id === vs.visitId);
      return visit && visit.carId === selectedCarId && vs.oilDetails?.nextChangeOdometer;
    });

    servicesWithMilestone.forEach((vs: VisitService) => {
      if (vs.oilDetails?.nextChangeOdometer && visitOdometer >= vs.oilDetails.nextChangeOdometer) {
        warnings.push(`⚠️ تنبيه: خدمة ${vs.serviceName} السابقة تجاوزت المسافة المحددة (${vs.oilDetails.nextChangeOdometer.toLocaleString('ar-IQ')} كم)`);
      }
    });

    // Check if previous visits are still open or unpaid
    const activeVisits = visits.filter((v: Visit) => v.carId === selectedCarId && v.status !== 'سُلّمت' && v.status !== 'انتهت' && v.status !== 'Cancelled');
    if (activeVisits.length > 0) {
      warnings.push(`ℹ️ توجد زيارة صيانة نشطة غير مغلقة لهذه السيارة حالياً.`);
    }

    return warnings;
  };

  const handleOpenNewVisit = () => {
    setSelectedCustomerId('');
    setSelectedCarId('');
    setVisitOdometer(0);
    setVisitDate(new Date().toISOString().split('T')[0]);
    setVisitTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
    setVisitTechId('');
    setCustomerComplaint('');
    setReceptionNotes('');
    setVisitPriority('normal');
    setReceptionPhotos([]);
    setCustomerSearch('');
    setWizardStep(1);
    setIsNewVisitOpen(true);
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedCarId('');
    setVisitOdometer(0);
    
    // Auto fill default tech if available
    if (technicians.length > 0 && !visitTechId) {
      setVisitTechId(technicians[0].id);
    }

    const cCars = cars.filter((c: Car) => c.customerId === customerId);
    if (cCars.length === 1) {
      handleCarSelect(cCars[0].id);
    }
  };

  const handleCarSelect = (carId: string) => {
    setSelectedCarId(carId);
    const car = cars.find((c: Car) => c.id === carId);
    if (car) {
      setVisitOdometer(car.odometer);
    }
  };

  // Quick Customer Registration Submit
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName || !quickCustPhone || !quickCarName || !quickCarBrand) {
      toast.error('يرجى تعبئة الحقول المطلوبة للزبون والسيارة');
      return;
    }

    // 1. Add Customer
    const customerId = addCustomer({
      name: quickCustName,
      phone: quickCustPhone,
      address: quickCustAddress,
      notes: 'تمت إضافته سريعاً من استقبال كرت صيانة',
      tags: ['جديد']
    });

    // 2. Add Car
    addCar({
      customerId,
      name: quickCarName,
      brand: quickCarBrand,
      year: quickCarYear,
      color: quickCarColor,
      category: 'Sedan',
      plateNumber: quickCarPlate,
      chassisNumber: '',
      odometer: quickCarOdometer,
      notes: ''
    });

    // Reset fields
    setQuickCustName('');
    setQuickCustPhone('');
    setQuickCustAddress('');
    setQuickCarName('');
    setQuickCarBrand('');
    setQuickCarPlate('');
    setQuickCarOdometer(0);
    setIsQuickAddOpen(false);

    // Auto select
    handleCustomerSelect(customerId);
    toast.success('تم تسجيل الزبون والسيارة بنجاح');
  };

  // Voice Recognition Handler
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('ميزة الإملاء الصوتي غير مدعومة في هذا المتصفح');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-IQ'; // Iraqi Arabic dialect or general Arabic
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setCustomerComplaint(prev => prev ? `${prev} ${speechToText}` : speechToText);
      setIsListening(false);
      toast.success('تمت إضافة النص بنجاح');
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      toast.error('حدث خطأ أثناء التعرف على الصوت');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Add Photo URL helper (mock photo upload)
  const handleAddPhotoUrl = () => {
    if (!imageInputUrl) return;
    setReceptionPhotos(prev => [...prev, { url: imageInputUrl, uploadedAt: new Date().toISOString() }]);
    setImageInputUrl('');
    toast.success('تمت إضافة الصورة بنجاح');
  };

  // Auto-generate generic inspection photo mock
  const handleAddMockPhoto = () => {
    const mockImages = [
      'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=500&auto=format&fit=crop&q=60'
    ];
    const randomIndex = Math.floor(Math.random() * mockImages.length);
    setReceptionPhotos(prev => [...prev, { url: mockImages[randomIndex], uploadedAt: new Date().toISOString() }]);
    toast.success('تمت إضافة صورة فحص تجريبية');
  };

  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedCarId || !visitTechId || visitOdometer <= 0) {
      toast.error('يرجى تعبئة الحقول المطلوبة');
      return;
    }

    const fullEntryDate = `${visitDate}T${visitTime}:00`;

    const newId = addVisit({
      customerId: selectedCustomerId,
      carId: selectedCarId,
      technicianId: visitTechId,
      entryDate: visitDate,
      entryOdometer: visitOdometer,
      notes: receptionNotes,
      // Overhaul additions
      priority: visitPriority,
      customerComplaint: customerComplaint,
      receptionNotes: receptionNotes,
      receptionPhotos: receptionPhotos,
      createdBy: 'u3' // Assumed current user admin/operator
    });

    toast.success('تم تسجيل زيارة صيانة جديدة وفتح كرت الدخول');
    
    // Simulate Print slip redirection or print command
    if (printSlipOption) {
      toast.success('تم إرسال كرت الاستقبال إلى الطابعة...');
    }

    // Simulate Whatsapp Notification
    if (whatsappOption) {
      const cust = customers.find((c: Customer) => c.id === selectedCustomerId);
      const car = cars.find((c: Car) => c.id === selectedCarId);
      if (cust && car) {
        const text = `أهلاً زبوننا الكريم ${cust.name}، تم استقبال سيارتكم ${car.brand} ${car.name} لوحة (${car.plateNumber}) في مركز نوزل لصيانة السيارات بنجاح. رقم الكرت: ${newId.substring(0, 8)}. سنتواصل معكم فور جهوزية السيارة. شكراً لثقتكم.`;
        const waUrl = `https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
      }
    }

    setIsNewVisitOpen(false);
    navigate(`/visits/${newId}`);
  };

  const getCustomerName = (customerId: string) => {
    const cust = customers.find((c: Customer) => c.id === customerId);
    return cust ? cust.name : '-';
  };

  const getCarLabel = (carId: string) => {
    const car = cars.find((c: Car) => c.id === carId);
    return car ? `${car.brand} ${car.name} (${car.plateNumber})` : '-';
  };

  const getTechName = (techId?: string) => {
    const tech = users.find((u: StoreUser) => u.id === techId);
    return tech ? tech.name : '-';
  };

  const getVisitInvoiceTotal = (visitId: string) => {
    const inv = invoices.find((i: Invoice) => i.visitId === visitId);
    if (inv) return formatCurrency(inv.total, settings.currency);
    
    const vs = visitServices.filter((item: VisitService) => item.visitId === visitId);
    const subtotal = vs.reduce((sum: number, item: VisitService) => sum + (item.unitPrice * item.qty), 0);
    return subtotal > 0 ? `~ ${formatCurrency(subtotal, settings.currency)}` : '-';
  };

  // Kanban Native Drag and Drop Status Change
  const handleStatusChange = (visitId: string, newStatus: VisitStatus) => {
    updateVisit(visitId, { status: newStatus });
    toast.success(`تم تحديث حالة الزيارة إلى: ${newStatus}`);
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // 0: Sunday, 1: Monday, etc.
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentCalendarDate(prev => {
      const nextDate = new Date(prev);
      if (direction === 'prev') {
        nextDate.setMonth(nextDate.getMonth() - 1);
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      return nextDate;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentCalendarDate);
    const firstDay = getFirstDayOfMonth(currentCalendarDate);
    const daysArray = [];

    // Empty cells for alignment before month start
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="h-28 bg-slate-50/40 dark:bg-brand-bg-dark/20 border border-brand-border-light dark:border-brand-border-dark/60 rounded-xl" />);
    }

    // Days grid
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayVisits = filteredVisits.filter((v: Visit) => v.entryDate === dateString);

      daysArray.push(
        <div 
          key={`day-${day}`} 
          className="h-28 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark/60 p-2.5 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-400 dark:hover:border-brand-accent-light transition-all cursor-pointer group"
          onClick={() => {
            if (dayVisits.length > 0) {
              setSearchQuery(dateString);
              setViewMode('table');
              toast.success(`عرض زيارات تاريخ ${dateString}`);
            }
          }}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
              {day}
            </span>
            {dayVisits.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-indigo-500 text-white shadow-sm">
                {dayVisits.length}
              </span>
            )}
          </div>
          
          <div className="mt-1 flex-1 overflow-y-auto space-y-1 scrollbar-none">
            {dayVisits.slice(0, 2).map((v: Visit) => {
              const cust = customers.find((c: Customer) => c.id === v.customerId);
              return (
                <div 
                  key={v.id} 
                  className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-brand-accent-light font-cairo font-semibold truncate"
                >
                  {cust?.name || 'زبون'}
                </div>
              );
            })}
            {dayVisits.length > 2 && (
              <div className="text-[8px] text-brand-muted-light dark:text-brand-muted-dark font-cairo text-center font-bold">
                +{dayVisits.length - 2} إضافية
              </div>
            )}
          </div>
        </div>
      );
    }

    return daysArray;
  };

  const ARABIC_MONTHS = [
    "كانون الثاني (1)", "شباط (2)", "آذار (3)", "نيسان (4)", "أيار (5)", "حزيران (6)", 
    "تموز (7)", "آب (8)", "أيلول (9)", "تشرين الأول (10)", "تشرين الثاني (11)", "كانون الأول (12)"
  ];

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header: Switch between List mode & Reception Wizard */}
      {!isNewVisitOpen ? (
        <>
          {/* Filters & Navigation Controls */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-4 rounded-2xl shadow-sm">
            
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              {/* Layout Toggle */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-brand-bg-dark rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cairo transition-all ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-brand-surface-dark text-indigo-600 dark:text-brand-accent-light shadow-sm'
                      : 'text-brand-muted-light dark:text-brand-muted-dark hover:text-brand-text-light dark:hover:text-brand-text-dark'
                  }`}
                >
                  جدول الزيارات
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cairo transition-all ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-brand-surface-dark text-indigo-600 dark:text-brand-accent-light shadow-sm'
                      : 'text-brand-muted-light dark:text-brand-muted-dark hover:text-brand-text-light dark:hover:text-brand-text-dark'
                  }`}
                >
                  لوحة المتابعة (Kanban)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cairo transition-all ${
                    viewMode === 'calendar'
                      ? 'bg-white dark:bg-brand-surface-dark text-indigo-600 dark:text-brand-accent-light shadow-sm'
                      : 'text-brand-muted-light dark:text-brand-muted-dark hover:text-brand-text-light dark:hover:text-brand-text-dark'
                  }`}
                >
                  تقويم الزيارات
                </button>
              </div>

              {/* Quick Filters (Only shown in list/table mode) */}
              {viewMode === 'table' && (
                <div className="flex flex-wrap gap-1.5 overflow-x-auto shrink-0">
                  {[
                    { label: 'الكل', value: 'All' },
                    { label: 'منتظر', value: 'منتظر' },
                    { label: 'استقبلت', value: 'استقبلت' },
                    { label: 'قيد الفحص', value: 'قيد الفحص' },
                    { label: 'قيد التنفيذ', value: 'قيد التنفيذ' },
                    { label: 'انتهت', value: 'انتهت' },
                    { label: 'سُلّمت', value: 'سُلّمت' }
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setStatusFilter(tab.value as any);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-cairo transition-all ${
                        statusFilter === tab.value
                          ? 'bg-indigo-600 dark:bg-brand-accent-light text-white shadow-sm'
                          : 'text-brand-muted-light dark:text-brand-muted-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:max-w-md">
              {/* Search input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="بحث باسم الزبون أو الهاتف..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-cairo text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-brand-muted-light dark:text-brand-muted-dark">
                  <Search className="w-4 h-4" />
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted-light hover:text-brand-text-light dark:hover:text-brand-text-dark"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Reception Button */}
              <button
                onClick={handleOpenNewVisit}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-brand-accent-light dark:hover:bg-brand-accent-light/90 text-white flex items-center gap-2 text-sm font-semibold font-cairo shadow-lg shadow-indigo-600/10 transition-all shrink-0 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل استقبال</span>
              </button>
            </div>

          </div>

          {/* Table View Mode */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-sm overflow-hidden">
              {paginatedVisits.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border-light dark:border-brand-border-dark text-xs text-brand-muted-light dark:text-brand-muted-dark font-semibold font-cairo">
                        <th className="p-4">الزبون</th>
                        <th className="p-4">السيارة</th>
                        <th className="p-4">تاريخ الدخول</th>
                        <th className="p-4">الفني المسؤول</th>
                        <th className="p-4">عداد الزيارة</th>
                        <th className="p-4">الأولوية</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">المجموع الكلي</th>
                        <th className="p-4 text-left">التحكم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border-light dark:divide-brand-border-dark/60 text-sm">
                      {paginatedVisits.map((visit: Visit) => (
                        <tr 
                          key={visit.id} 
                          onClick={() => navigate(`/visits/${visit.id}`)}
                          className="hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark/50 transition-colors cursor-pointer group"
                        >
                          <td className="p-4 font-semibold text-brand-text-light dark:text-brand-text-dark font-cairo group-hover:text-indigo-600 dark:group-hover:text-brand-accent-dark transition-colors">
                            {getCustomerName(visit.customerId)}
                          </td>
                          <td className="p-4 text-brand-text-light dark:text-brand-text-dark font-cairo">
                            {getCarLabel(visit.carId)}
                          </td>
                          <td className="p-4 text-xs text-brand-muted-light dark:text-brand-muted-dark">
                            {formatDate(visit.entryDate)}
                          </td>
                          <td className="p-4 text-brand-muted-light dark:text-brand-muted-dark font-cairo">
                            {getTechName(visit.technicianId)}
                          </td>
                          <td className="p-4 font-semibold text-brand-text-light dark:text-brand-text-dark font-cairo">
                            {visit.entryOdometer.toLocaleString('ar-IQ')} كم
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold font-cairo
                              ${
                                visit.priority === 'vip'
                                  ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'
                                  : visit.priority === 'urgent'
                                  ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {visit.priority === 'vip' ? 'VIP' : visit.priority === 'urgent' ? 'عاجل' : 'عادي'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold font-cairo
                              ${
                                visit.status === 'منتظر' || visit.status === 'Open'
                                  ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                                  : visit.status === 'استقبلت'
                                  ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400'
                                  : visit.status === 'قيد الفحص'
                                  ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400'
                                  : visit.status === 'قيد التنفيذ' || visit.status === 'In Progress'
                                  ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400'
                                  : visit.status === 'انتهت' || visit.status === 'Completed'
                                  ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400'
                                  : visit.status === 'سُلّمت'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                              }`}
                            >
                              {visit.status === 'Open' ? 'مفتوحة' : visit.status === 'In Progress' ? 'قيد العمل' : visit.status === 'Completed' ? 'مكتملة' : visit.status}
                            </span>
                          </td>
                          <td className="p-4 font-cairo">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="font-bold text-brand-text-light dark:text-brand-text-dark font-mono">
                                {getVisitInvoiceTotal(visit.id)}
                              </span>
                              {visit.invoiceIssued && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  visit.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                                  visit.paymentStatus === 'partial' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' : 'bg-red-50 text-red-500 dark:bg-red-950/20 dark:text-red-400'
                                }`}>
                                  {visit.paymentStatus === 'paid' ? '✓ مدفوعة بالكامل' : visit.paymentStatus === 'partial' ? 'سداد جزئي' : 'آجل بالكامل'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-left" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/visits/${visit.id}`)}
                              className="p-2 rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-brand-accent-dark transition-colors inline-flex items-center gap-1 text-xs font-semibold font-cairo"
                            >
                              عرض كرت
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8">
                  <EmptyState
                    title="لا توجد زيارات مسجلة"
                    description="لم يتم العثور على أي كرت زيارة صيانة متطابق مع عوامل التصفية الحالية."
                    actionLabel="تسجيل زيارة صيانة جديدة"
                    onAction={handleOpenNewVisit}
                    icon={<ClipboardList className="w-8 h-8" />}
                  />
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-brand-border-light dark:border-brand-border-dark">
                  <span className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">
                    عرض الصفحة {currentPage} من أصل {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark hover:bg-indigo-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark hover:bg-indigo-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Kanban Board View Mode */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 overflow-x-auto pb-4 items-stretch select-none">
              {KANBAN_STATUSES.map((columnStatus) => {
                const columnVisits = filteredVisits.filter((v: Visit) => {
                  let mappedStatus = v.status;
                  if (v.status === 'Open') mappedStatus = 'منتظر';
                  else if (v.status === 'In Progress') mappedStatus = 'قيد التنفيذ';
                  else if (v.status === 'Completed') mappedStatus = 'سُلّمت';
                  else if (v.status === 'Cancelled') return false; 
                  
                  return mappedStatus === columnStatus;
                });

                return (
                  <div 
                    key={columnStatus}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const visitId = e.dataTransfer.getData('text/plain');
                      if (visitId) handleStatusChange(visitId, columnStatus);
                    }}
                    className="flex flex-col bg-slate-50/50 dark:bg-brand-surface-dark/40 border border-brand-border-light dark:border-brand-border-dark rounded-2xl p-3 min-w-[245px] transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 border-b border-brand-border-light dark:border-brand-border-dark pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${getColumnStatusColor(columnStatus)}`} />
                        <h3 className="font-bold text-xs text-brand-text-light dark:text-brand-text-dark font-cairo">
                          {columnStatus}
                        </h3>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-brand-bg-dark text-brand-muted-light dark:text-brand-muted-dark font-bold font-cairo">
                        {columnVisits.length}
                      </span>
                    </div>

                    {/* Cards body */}
                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[620px] min-h-[250px] p-0.5">
                      {columnVisits.length > 0 ? (
                        columnVisits.map((visit: Visit) => {
                          const cust = customers.find((c: Customer) => c.id === visit.customerId);
                          const car = cars.find((c: Car) => c.id === visit.carId);
                          const tech = users.find((u: StoreUser) => u.id === visit.technicianId);
                          
                          return (
                            <div
                              key={visit.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', visit.id);
                              }}
                              className="bg-white dark:bg-brand-bg-dark border border-brand-border-light dark:border-brand-border-dark rounded-xl p-3 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-brand-accent-light transition-all cursor-grab active:cursor-grabbing text-right group relative overflow-hidden"
                              onClick={() => navigate(`/visits/${visit.id}`)}
                            >
                              {/* Top priority banner indicator */}
                              <div className={`absolute top-0 right-0 left-0 h-1 ${
                                visit.priority === 'vip' ? 'bg-purple-500' : visit.priority === 'urgent' ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'
                              }`} />

                              {/* Customer and car plate */}
                              <div className="mb-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-xs text-brand-text-light dark:text-brand-text-dark font-cairo group-hover:text-indigo-600 dark:group-hover:text-brand-accent-dark transition-colors truncate">
                                    {cust?.name || '-'}
                                  </h4>
                                  {visit.priority !== 'normal' && (
                                    <span className={`text-[8px] font-extrabold px-1 rounded font-cairo ${
                                      visit.priority === 'vip' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {visit.priority === 'vip' ? 'VIP' : 'عاجل'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-brand-muted-light dark:text-brand-muted-dark font-cairo truncate mt-0.5">
                                  {car ? `${car.brand} ${car.name}` : '-'}
                                </p>
                              </div>

                              {/* License Plate visually styled */}
                              {car?.plateNumber && (
                                <div className="mb-2 bg-slate-50 dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-md py-0.5 px-2 flex items-center justify-between text-[9px]">
                                  <span className="text-brand-muted-light dark:text-brand-muted-dark font-bold font-cairo">العراق</span>
                                  <span className="font-bold font-mono text-brand-text-light dark:text-brand-text-dark">{car.plateNumber}</span>
                                </div>
                              )}

                              {/* Tech & Date */}
                              <div className="flex items-center justify-between text-[9px] text-brand-muted-light dark:text-brand-muted-dark border-t border-slate-100 dark:border-brand-surface-dark/40 pt-2 mt-2">
                                <span className="font-cairo">الفني: {tech?.name || '-'}</span>
                                <span>{formatDate(visit.entryDate)}</span>
                              </div>

                              {/* Manual move Select */}
                              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-brand-surface-dark/40 flex items-center justify-between gap-1.5" onClick={e => e.stopPropagation()}>
                                <span className="text-[8px] font-bold font-cairo text-brand-muted-light dark:text-brand-muted-dark">الحالة:</span>
                                <select
                                  value={visit.status}
                                  onChange={(e) => handleStatusChange(visit.id, e.target.value as VisitStatus)}
                                  className="text-[9px] bg-slate-50 dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded px-1 py-0.5 font-cairo text-brand-text-light dark:text-brand-text-dark focus:outline-none"
                                >
                                  {KANBAN_STATUSES.map(st => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </select>
                              </div>

                            </div>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-brand-muted-light dark:text-brand-muted-dark font-cairo text-[10px] border border-dashed border-brand-border-light dark:border-brand-border-dark/60 rounded-xl bg-slate-50/50 dark:bg-brand-bg-dark/10">
                          اسحب الكروت هنا
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Calendar View Mode */}
          {viewMode === 'calendar' && (
            <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-4 rounded-2xl shadow-sm space-y-4">
              {/* Calendar Header */}
              <div className="flex justify-between items-center border-b border-brand-border-light dark:border-brand-border-dark pb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-base text-brand-text-light dark:text-brand-text-dark font-cairo">
                    مواعيد صيانة {ARABIC_MONTHS[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => navigateMonth('prev')}
                    className="p-1.5 rounded-lg border border-brand-border-light dark:border-brand-border-dark hover:bg-slate-50 dark:hover:bg-brand-bg-dark transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-brand-text-light dark:text-brand-text-dark" />
                  </button>
                  <button 
                    onClick={() => setCurrentCalendarDate(new Date())}
                    className="px-2.5 py-1 text-xs font-bold font-cairo rounded-lg border border-brand-border-light dark:border-brand-border-dark hover:bg-slate-50 dark:hover:bg-brand-bg-dark"
                  >
                    اليوم
                  </button>
                  <button 
                    onClick={() => navigateMonth('next')}
                    className="p-1.5 rounded-lg border border-brand-border-light dark:border-brand-border-dark hover:bg-slate-50 dark:hover:bg-brand-bg-dark transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-brand-text-light dark:text-brand-text-dark" />
                  </button>
                </div>
              </div>

              {/* Weekday Names */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-brand-muted-light dark:text-brand-muted-dark font-cairo pb-1">
                <div>السبت</div>
                <div>الأحد</div>
                <div>الاثنين</div>
                <div>الثلاثاء</div>
                <div>الأربعاء</div>
                <div>الخميس</div>
                <div>الجمعة</div>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {renderCalendar()}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Full-page Smart 3-Step Reception Wizard */
        <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-lg p-6 space-y-6">
          
          {/* Header of Wizard */}
          <div className="flex justify-between items-center border-b border-brand-border-light dark:border-brand-border-dark pb-4">
            <div>
              <span className="text-xs text-indigo-500 font-extrabold font-cairo tracking-wider uppercase">كرت استقبال جديد</span>
              <h2 className="text-xl font-bold text-brand-text-light dark:text-brand-text-dark font-cairo mt-0.5">
                خطوة {wizardStep} من أصل 3: {
                  wizardStep === 1 ? 'اختيار العميل والسيارة' : 
                  wizardStep === 2 ? 'تفاصيل الاستقبال والفحص' : 
                  'المراجعة والتأكيد النهائي'
                }
              </h2>
            </div>
            
            <button
              onClick={() => setIsNewVisitOpen(false)}
              className="p-2 rounded-xl text-brand-muted-light hover:bg-slate-50 dark:hover:bg-brand-bg-dark transition-colors border border-brand-border-light dark:border-brand-border-dark"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="relative">
            <div className="absolute top-1/2 right-0 left-0 h-1 bg-slate-100 dark:bg-brand-bg-dark transform -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 right-0 h-1 bg-indigo-500 transform -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((wizardStep - 1) / 2) * 100}%` }}
            />
            
            <div className="relative flex justify-between z-10">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  onClick={() => {
                    // Allow navigation backwards or only to steps already filled
                    if (step < wizardStep) setWizardStep(step);
                    else if (step === 2 && selectedCustomerId && selectedCarId) setWizardStep(2);
                    else if (step === 3 && selectedCustomerId && selectedCarId && visitTechId && visitOdometer > 0) setWizardStep(3);
                  }}
                  className={`w-10 h-10 rounded-full font-bold font-cairo flex items-center justify-center transition-all duration-200 border-2 ${
                    step < wizardStep 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                      : step === wizardStep
                      ? 'bg-white dark:bg-brand-surface-dark border-indigo-500 text-indigo-600 scale-110 shadow-lg' 
                      : 'bg-white dark:bg-brand-surface-dark border-slate-200 dark:border-brand-border-dark text-brand-muted-light dark:text-brand-muted-dark'
                  }`}
                >
                  {step < wizardStep ? <Check className="w-4 h-4" /> : step}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark font-cairo mt-2 px-1">
              <span>العميل والسيارة</span>
              <span>بيانات الاستقبال</span>
              <span>التأكيد والدخول</span>
            </div>
          </div>

          {/* STEP 1: SELECT CUSTOMER & CAR */}
          {wizardStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              
              {/* Left Column: Search & Quick Add Drawer */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-brand-text-light dark:text-brand-text-dark font-cairo flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    البحث عن عميل أو تسجيل عميل جديد
                  </h3>
                  
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                    className="text-xs text-indigo-600 dark:text-brand-accent-light font-bold font-cairo hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {isQuickAddOpen ? 'إلغاء التسجيل السريع' : 'تسجيل زبون وسيارته سريعاً'}
                  </button>
                </div>

                {isQuickAddOpen ? (
                  /* Inline Quick Add form */
                  <form onSubmit={handleQuickAddSubmit} className="bg-slate-50 dark:bg-brand-bg-dark border border-brand-border-light dark:border-brand-border-dark/60 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo border-b border-brand-border-light dark:border-brand-border-dark pb-2 mb-2 flex items-center gap-1.5 text-indigo-600 dark:text-brand-accent-light">
                      <Sparkles className="w-3.5 h-3.5" />
                      بيانات الزبون والسيارة السريعة
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark font-cairo mb-1">اسم الزبون المالك *</label>
                        <input
                          type="text"
                          required
                          value={quickCustName}
                          onChange={(e) => setQuickCustName(e.target.value)}
                          placeholder="مثال: أحمد فاروق"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-white dark:bg-brand-surface-dark focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark font-cairo mb-1">رقم الهاتف الجوال *</label>
                        <input
                          type="text"
                          required
                          value={quickCustPhone}
                          onChange={(e) => setQuickCustPhone(e.target.value)}
                          placeholder="0770XXXXXXX"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-white dark:bg-brand-surface-dark focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark font-cairo mb-1">العنوان / السكن</label>
                      <input
                        type="text"
                        value={quickCustAddress}
                        onChange={(e) => setQuickCustAddress(e.target.value)}
                        placeholder="بغداد - الكرادة"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-white dark:bg-brand-surface-dark focus:outline-none text-right"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-brand-border-dark/60 pt-3">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark font-cairo mb-1">ماركة السيارة *</label>
                        <input
                          type="text"
                          required
                          value={quickCarBrand}
                          onChange={(e) => setQuickCarBrand(e.target.value)}
                          placeholder="تويوتا / كيا"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-white dark:bg-brand-surface-dark focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark font-cairo mb-1">اسم/طراز السيارة *</label>
                        <input
                          type="text"
                          required
                          value={quickCarName}
                          onChange={(e) => setQuickCarName(e.target.value)}
                          placeholder="كامري / سبورتاج"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-white dark:bg-brand-surface-dark focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark font-cairo mb-1">سنة الصنع</label>
                        <input
                          type="number"
                          value={quickCarYear}
                          onChange={(e) => setQuickCarYear(parseInt(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-brand-border-light bg-white dark:bg-brand-surface-dark text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark font-cairo mb-1">رقم اللوحة</label>
                        <input
                          type="text"
                          value={quickCarPlate}
                          onChange={(e) => setQuickCarPlate(e.target.value)}
                          placeholder="12345 أ"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-brand-border-light bg-white dark:bg-brand-surface-dark text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark font-cairo mb-1">العداد الحالي *</label>
                        <input
                          type="number"
                          required
                          value={quickCarOdometer || ''}
                          onChange={(e) => setQuickCarOdometer(parseInt(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-brand-border-light bg-white dark:bg-brand-surface-dark text-right"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-cairo text-xs rounded-lg transition-colors shadow-sm"
                    >
                      تسجيل وحفظ الزبون حالياً
                    </button>
                  </form>
                ) : (
                  /* Standard searchable customer list */
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ابحث بالاسم أو رقم الهاتف..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right text-sm"
                      />
                      <Search className="absolute inset-y-0 right-3 w-4 h-4 my-auto text-brand-muted-light" />
                    </div>

                    <div className="border border-brand-border-light dark:border-brand-border-dark rounded-xl max-h-72 overflow-y-auto divide-y divide-brand-border-light dark:divide-brand-border-dark/60 bg-white dark:bg-brand-surface-dark">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((cust: Customer) => (
                          <div
                            key={cust.id}
                            onClick={() => handleCustomerSelect(cust.id)}
                            className={`p-3 text-right cursor-pointer transition-colors flex justify-between items-center ${
                              selectedCustomerId === cust.id 
                                ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-r-4 border-indigo-500' 
                                : 'hover:bg-slate-50 dark:hover:bg-brand-bg-dark/40'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-xs text-brand-text-light dark:text-brand-text-dark font-cairo">{cust.name}</p>
                              <span className="text-[10px] text-brand-muted-light dark:text-brand-muted-dark direction-ltr block mt-0.5">{cust.phone}</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-brand-bg-dark text-slate-700 dark:text-slate-400 font-bold font-cairo">
                              {getCustomerDebts(cust.id) > 0 ? `دين: ${getCustomerDebts(cust.id).toLocaleString('ar-IQ')} د.ع` : 'بلا ديون'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark text-center py-6 font-cairo">لم يتم العثور على زبائن. جرب التسجيل السريع بالأعلى.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Customer Card & Vehicles */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-brand-text-light dark:text-brand-text-dark font-cairo flex items-center gap-2">
                  <CarIcon className="w-4 h-4 text-indigo-500" />
                  تفاصيل العميل والسيارات التابعة له
                </h3>

                {selectedCustomerId ? (
                  <div className="space-y-4">
                    {/* Selected Customer Details */}
                    {(() => {
                      const cust = customers.find((c: Customer) => c.id === selectedCustomerId);
                      if (!cust) return null;
                      const debt = getCustomerDebts(cust.id);
                      const lastVisit = getCustomerLastVisit(cust.id);
                      
                      return (
                        <div className="bg-slate-50 dark:bg-brand-bg-dark/50 border border-brand-border-light dark:border-brand-border-dark p-4 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-brand-text-light dark:text-brand-text-dark font-cairo">{cust.name}</h4>
                              <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo mt-1">الهاتف: {cust.phone}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-cairo ${
                              debt > 0 
                                ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' 
                                : 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400'
                            }`}>
                              {debt > 0 ? `الديون المعلقة: ${debt.toLocaleString('ar-IQ')} د.ع` : 'الحساب سليم'}
                            </span>
                          </div>

                          <div className="text-[10px] text-brand-muted-light dark:text-brand-muted-dark font-cairo flex items-center justify-between border-t border-slate-200 dark:border-brand-border-dark/60 pt-2">
                            <span>آخر زيارة: {lastVisit ? formatDate(lastVisit) : 'زيارة أولى'}</span>
                            <span>تاريخ التسجيل: {formatDate(cust.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Vehicles Selection List */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">السيارات المسجلة للزبون:</label>
                      
                      {customerCars.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {customerCars.map((car: Car) => (
                            <div
                              key={car.id}
                              onClick={() => handleCarSelect(car.id)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                selectedCarId === car.id
                                  ? 'bg-indigo-500 text-white border-indigo-600 shadow-md'
                                  : 'bg-white dark:bg-brand-surface-dark border-brand-border-light dark:border-brand-border-dark text-brand-text-light dark:text-brand-text-dark hover:bg-slate-50 dark:hover:bg-brand-bg-dark/30'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold font-cairo">{car.brand} {car.name}</span>
                                <span className={`text-[9px] font-mono font-bold ${selectedCarId === car.id ? 'text-indigo-100' : 'text-brand-muted-light dark:text-brand-muted-dark'}`}>{car.year}</span>
                              </div>
                              <div className="mt-2 flex justify-between items-center text-[10px]">
                                <span className="font-cairo font-semibold">لوحة: {car.plateNumber}</span>
                                <span>{car.odometer.toLocaleString('ar-IQ')} كم</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 border border-dashed border-red-200 text-center rounded-xl bg-red-50/20 text-red-500 text-xs font-cairo">
                          ⚠️ هذا الزبون لا يمتلك أي سيارة مسجلة. يرجى تفعيل التسجيل السريع للسيارة أعلاه.
                        </div>
                      )}
                    </div>

                    {/* Warnings Section (Overdue milstones, active visits) */}
                    {selectedCarId && getCarWarnings().length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-xl space-y-1">
                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 font-cairo flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          تنبيهات صيانة للسيارة
                        </h4>
                        {getCarWarnings().map((w, idx) => (
                          <p key={idx} className="text-[10px] text-amber-700 dark:text-amber-400 font-cairo pl-1">
                            {w}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-brand-border-light dark:border-brand-border-dark/60 rounded-xl bg-slate-50/40 dark:bg-brand-bg-dark/10 text-center text-brand-muted-light dark:text-brand-muted-dark">
                    <User className="w-8 h-8 opacity-40 mb-2" />
                    <p className="text-xs font-cairo">يرجى تحديد زبون من القائمة لعرض تفاصيله وسياراته</p>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* STEP 2: RECEPTION DETAILS (INTAKE DETAILS) */}
          {wizardStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              
              {/* Left Column: Intake Logs */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-brand-text-light dark:text-brand-text-dark font-cairo flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  سجل الدخول وإدارة الورشة
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo mb-2">تاريخ الدخول *</label>
                    <input
                      type="date"
                      required
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo mb-2">وقت الدخول *</label>
                    <input
                      type="time"
                      required
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo mb-2">عداد دخول السيارة الحالي (كم) *</label>
                  <input
                    type="number"
                    required
                    value={visitOdometer || ''}
                    onChange={(e) => setVisitOdometer(parseInt(e.target.value))}
                    placeholder="أدخل المسافة بالكيلومترات..."
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  />
                  {(() => {
                    const car = cars.find((c: Car) => c.id === selectedCarId);
                    if (car && visitOdometer < car.odometer) {
                      return (
                        <p className="text-[10px] text-red-500 font-bold font-cairo mt-1">
                          ⚠️ تنبيه: العداد المدخل أقل من آخر قراءة مسجلة للسيارة ({car.odometer.toLocaleString('ar-IQ')} كم)
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo mb-2">تعيين الفني المسؤول *</label>
                  <select
                    required
                    value={visitTechId}
                    onChange={(e) => setVisitTechId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  >
                    <option value="">-- اختر فني الصيانة المسؤول --</option>
                    {technicians.map((t: StoreUser) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.role === 'admin' ? 'مشرف الورشة' : 'فني صيانة'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo mb-2">مستوى أولوية الزيارة</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'normal', label: 'عادي (Normal)', color: 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400', activeColor: 'bg-slate-500 text-white border-slate-500' },
                      { id: 'urgent', label: 'عاجل (Urgent)', color: 'border-red-300 dark:border-red-900 text-red-700 dark:text-red-400', activeColor: 'bg-red-600 text-white border-red-600' },
                      { id: 'vip', label: 'VIP عميل مميز', color: 'border-purple-300 dark:border-purple-900 text-purple-700 dark:text-purple-400', activeColor: 'bg-purple-600 text-white border-purple-600' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setVisitPriority(p.id as any)}
                        className={`py-2 px-3 border text-xs font-bold font-cairo rounded-xl transition-all ${
                          visitPriority === p.id ? p.activeColor : p.color
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Voice text complaints & Uploader */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-brand-text-light dark:text-brand-text-dark font-cairo flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-500" />
                  شكاوى الزبون وتوثيق حالة السيارة
                </h3>

                {/* Complaint voice dictation */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">شكوى الزبون الرئيسية</label>
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`px-3 py-1 text-xs font-bold font-cairo rounded-lg flex items-center gap-1.5 transition-all ${
                        isListening 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-brand-accent-light'
                      }`}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      {isListening ? 'جاري الاستماع...' : 'إملاء صوتی'}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={customerComplaint}
                    onChange={(e) => setCustomerComplaint(e.target.value)}
                    placeholder="مثال: صوت طقطقة في العجلة الأمامية اليمنى عند الانعطاف..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none text-right resize-none"
                  />
                </div>

                {/* Reception Note */}
                <div>
                  <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo mb-2">ملاحظات الاستقبال وتشخيص الورشة</label>
                  <textarea
                    rows={3}
                    value={receptionNotes}
                    onChange={(e) => setReceptionNotes(e.target.value)}
                    placeholder="ملاحظات حول الهيكل الخارجي، أو فحص الورشة المبدئي قبل الفك..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-slate-50 dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none text-right resize-none"
                  />
                </div>

                {/* Photos Uploader */}
                <div>
                  <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo mb-2">توثيق الأضرار / صور استلام السيارة</label>
                  
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={imageInputUrl}
                      onChange={(e) => setImageInputUrl(e.target.value)}
                      placeholder="رابط الصورة الخارجية..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-white dark:bg-brand-surface-dark text-right"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhotoUrl}
                      className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold font-cairo rounded-lg transition-colors"
                    >
                      إضافة رابط
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMockPhoto}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-brand-bg-dark hover:bg-slate-200 text-brand-text-light dark:text-brand-text-dark text-xs font-bold font-cairo rounded-lg border border-brand-border-light dark:border-brand-border-dark transition-colors"
                    >
                      صورة تجريبية
                    </button>
                  </div>

                  {receptionPhotos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 border border-brand-border-light dark:border-brand-border-dark p-2 rounded-xl bg-slate-50/50 dark:bg-brand-bg-dark/20 max-h-36 overflow-y-auto">
                      {receptionPhotos.map((photo, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-brand-border-dark h-16 bg-slate-100">
                          <img src={photo.url} alt="Intake doc" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setReceptionPhotos(prev => prev.filter((_, idx) => idx !== index))}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-brand-border-light dark:border-brand-border-dark/60 text-center rounded-xl bg-slate-50/20 text-brand-muted-light text-xs font-cairo">
                      لا توجد صور موثقة حالياً لكرت الدخول.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* STEP 3: CONFIRMATION & REVIEW */}
          {wizardStep === 3 && (
            <div className="space-y-6 pt-4">
              
              {/* Summary Card */}
              <div className="bg-slate-50 dark:bg-brand-bg-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-base text-brand-text-light dark:text-brand-text-dark font-cairo border-b border-slate-200 dark:border-brand-border-dark/60 pb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  مراجعة ملخص بيانات الدخول للصيانة
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                  
                  {/* Customer Card */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-brand-muted-light font-bold font-cairo block">بيانات العميل:</span>
                    {(() => {
                      const cust = customers.find((c: Customer) => c.id === selectedCustomerId);
                      return (
                        <div className="bg-white dark:bg-brand-surface-dark border border-slate-200 dark:border-brand-border-dark p-3 rounded-xl">
                          <h4 className="font-bold text-xs text-brand-text-light dark:text-brand-text-dark font-cairo">{cust?.name}</h4>
                          <p className="text-[10px] text-brand-muted-light mt-0.5">{cust?.phone}</p>
                          <p className="text-[10px] text-brand-muted-light mt-0.5">{cust?.address || 'بدون عنوان'}</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Vehicle Card */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-brand-muted-light font-bold font-cairo block">بيانات المركبة:</span>
                    {(() => {
                      const car = cars.find((c: Car) => c.id === selectedCarId);
                      return (
                        <div className="bg-white dark:bg-brand-surface-dark border border-slate-200 dark:border-brand-border-dark p-3 rounded-xl">
                          <h4 className="font-bold text-xs text-brand-text-light dark:text-brand-text-dark font-cairo">{car?.brand} {car?.name}</h4>
                          <p className="text-[10px] text-brand-muted-light mt-0.5">لوحة: {car?.plateNumber}</p>
                          <p className="text-[10px] text-brand-muted-light mt-0.5">العداد المسجل: {visitOdometer.toLocaleString('ar-IQ')} كم</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Administrative details */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-brand-muted-light font-bold font-cairo block">إدارة الزيارة:</span>
                    <div className="bg-white dark:bg-brand-surface-dark border border-slate-200 dark:border-brand-border-dark p-3 rounded-xl space-y-1 text-xs">
                      <p className="text-brand-text-light dark:text-brand-text-dark font-cairo">الفني المسؤول: <strong className="text-indigo-600 dark:text-brand-accent-light">{getTechName(visitTechId)}</strong></p>
                      <p className="text-brand-text-light dark:text-brand-text-dark font-cairo">أولوية الصيانة: <strong className="text-red-600 font-bold">{visitPriority === 'vip' ? 'VIP مميز جداً' : visitPriority === 'urgent' ? 'عاجل فوري' : 'عادي'}</strong></p>
                      <p className="text-brand-text-light dark:text-brand-text-dark font-cairo">توقيت الدخول: {formatDate(visitDate)} {visitTime}</p>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 dark:border-brand-border-dark/60 pt-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-brand-muted-light font-bold font-cairo">شكوى الزبون:</span>
                    <p className="text-xs text-brand-text-light dark:text-brand-text-dark bg-white dark:bg-brand-surface-dark p-3 rounded-xl border border-slate-200 dark:border-brand-border-dark font-cairo min-h-[50px] leading-relaxed">
                      {customerComplaint || 'لم يتم تسجيل شكوى صوتية أو مكتوبة.'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-brand-muted-light font-bold font-cairo">ملاحظات الاستقبال:</span>
                    <p className="text-xs text-brand-text-light dark:text-brand-text-dark bg-white dark:bg-brand-surface-dark p-3 rounded-xl border border-slate-200 dark:border-brand-border-dark font-cairo min-h-[50px] leading-relaxed">
                      {receptionNotes || 'لم يتم تسجيل تشخيص استقبال إضافي.'}
                    </p>
                  </div>
                </div>

                {receptionPhotos.length > 0 && (
                  <div className="space-y-1.5 border-t border-slate-200 dark:border-brand-border-dark/60 pt-4">
                    <span className="text-[10px] text-brand-muted-light font-bold font-cairo">الصور المرفقة ({receptionPhotos.length}):</span>
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {receptionPhotos.map((photo, idx) => (
                        <img key={idx} src={photo.url} className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-brand-border-dark" />
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Printing & Notification Actions */}
              <div className="flex flex-col md:flex-row gap-4 justify-between bg-slate-50 dark:bg-brand-bg-dark border border-brand-border-light dark:border-brand-border-dark p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-indigo-500" />
                  <div>
                    <h4 className="text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">طباعة كرت دخول الصيانة فوراً</h4>
                    <p className="text-[10px] text-brand-muted-light font-cairo">تجهيز كرت الاستقبال للطباعة على الطابعة الحرارية بعد الحفظ</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={printSlipOption}
                    onChange={(e) => setPrintSlipOption(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mr-auto"
                  />
                </div>

                <div className="flex items-center gap-3 border-t md:border-t-0 md:border-r border-slate-200 dark:border-brand-border-dark/60 pt-3 md:pt-0 md:pr-4">
                  <Send className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h4 className="text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">إشعار دخول عبر الواتساب للعميل</h4>
                    <p className="text-[10px] text-brand-muted-light font-cairo">إرسال رسالة ترحيبية فورية تحوي رقم كرت الاستقبال وتفاصيل الدخول للسيارة</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={whatsappOption}
                    onChange={(e) => setWhatsappOption(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mr-auto"
                  />
                </div>
              </div>

            </div>
          )}

          {/* Wizard Navigation Actions Footer */}
          <div className="flex justify-between items-center border-t border-brand-border-light dark:border-brand-border-dark pt-4 gap-4">
            <button
              type="button"
              disabled={wizardStep === 1}
              onClick={() => setWizardStep(prev => prev - 1)}
              className="px-5 py-2.5 text-xs font-bold font-cairo rounded-xl border border-brand-border-light dark:border-brand-border-dark hover:bg-slate-50 dark:hover:bg-brand-bg-dark disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              السابق
            </button>

            {wizardStep < 3 ? (
              <button
                type="button"
                disabled={wizardStep === 1 && (!selectedCustomerId || !selectedCarId)}
                onClick={() => {
                  if (wizardStep === 1) {
                    if (!selectedCustomerId || !selectedCarId) {
                      toast.error('يرجى اختيار العميل والسيارة للاستمرار');
                      return;
                    }
                    setWizardStep(2);
                  } else if (wizardStep === 2) {
                    if (!visitTechId || visitOdometer <= 0) {
                      toast.error('يرجى تعيين الفني وإدخال العداد للاستمرار');
                      return;
                    }
                    setWizardStep(3);
                  }
                }}
                className="px-6 py-2.5 text-xs font-bold font-cairo bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                المتابعة للخطوة التالية
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveVisit}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold font-cairo text-sm rounded-xl transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>فتح كرت زيارة الصيانة (✓ فتح الزيارة)</span>
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default Visits;
