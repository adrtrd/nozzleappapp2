import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  UserPlus, 
  X,
  Phone,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users
} from 'lucide-react';
import { useStore, Customer, Car, Visit } from '../store/store';
import { toast } from '../store/toastStore';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

interface CustomerCardProps {
  customer: Customer;
  activeVisit: Visit | undefined;
  isActive: boolean;
  onEdit: (customer: Customer, e: React.MouseEvent) => void;
  onDelete: (customer: Customer, e: React.MouseEvent) => void;
}

function CustomerCard({ customer, activeVisit, isActive, onEdit, onDelete }: CustomerCardProps) {
  const navigate = useNavigate();
  const visits = useStore((state: any) => state.visits);
  const cars = useStore((state: any) => state.cars);

  const customerVisits = visits.filter((v: Visit) => v.customerId === customer.id);
  const customerCars = cars.filter((c: Car) => c.customerId === customer.id);
  const totalDebt = customerVisits.reduce((sum: number, v: Visit) => sum + (v.totalRemaining || 0), 0);

  const activeCar = activeVisit
    ? cars.find((c: Car) => c.id === activeVisit.carId)
    : null;

  return (
    <div
      onClick={() => navigate(`/customers/${customer.id}`)}
      style={{
        background: isActive
          ? 'linear-gradient(135deg, #F0FDF4, #DCFCE7)'
          : 'var(--color-background-primary)',
        border: isActive
          ? '1.5px solid #86EFAC'
          : '1px solid var(--color-border-tertiary)',
        borderRadius: '12px',
        padding: '14px 16px',
        cursor: 'pointer',
        direction: 'rtl',
        transition: 'all 0.15s',
        boxShadow: isActive
          ? '0 2px 12px rgba(22,163,74,0.12)'
          : 'none',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--color-background-secondary)';
        }
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--color-background-primary)';
        }
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {/* Avatar + name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1,
          minWidth: 0,
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: isActive
                ? '#16A34A'
                : (customer.avatarColor || '#6366F1'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '18px',
              fontWeight: '700',
              border: isActive
                ? '2px solid #86EFAC'
                : '2px solid transparent',
            }}>
              {customer.name?.charAt(0) || '؟'}
            </div>
            {/* Active indicator dot */}
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                width: '13px',
                height: '13px',
                borderRadius: '50%',
                background: '#16A34A',
                border: '2px solid #fff',
                boxShadow: '0 0 6px #16A34A',
                animation: 'pulse 1.2s infinite',
              }} />
            )}
          </div>

          {/* Info */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontSize: '15px',
                fontWeight: '600',
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
              }} className="font-cairo font-bold">
                {customer.name}
              </span>

              {/* IN CENTER NOW badge */}
              {isActive && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#16A34A',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }} className="font-cairo">
                  <span style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#fff',
                    display: 'inline-block',
                    animation: 'pulse 1.2s infinite',
                  }} />
                  في المركز الآن
                </span>
              )}

              {totalDebt > 0 && (
                <span style={{
                  background: '#FEE2E2',
                  color: '#DC2626',
                  padding: '1px 7px',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: '600',
                  flexShrink: 0,
                }} className="font-cairo">
                  دين: {totalDebt.toLocaleString('ar-IQ')} د.ع
                </span>
              )}
            </div>

            {/* Phone + active visit info */}
            <div style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              marginTop: '3px',
            }} className="font-cairo">
              {customer.phone}
              {isActive && activeCar && (
                <span style={{
                  marginRight: '10px',
                  color: '#16A34A',
                  fontWeight: '500',
                }}>
                  • {activeCar.brand} {activeCar.name}
                  {activeVisit?.status === 'received' || activeVisit?.status === 'استقبلت' || activeVisit?.status === 'منتظر'
                    ? ' — في الاستقبال'
                    : ' — قيد التنفيذ'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats & Actions */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
            }} className="font-mono">
              {customerCars.length}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
            }} className="font-cairo">
              سيارة
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
            }} className="font-mono">
              {customerVisits.length}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
            }} className="font-cairo">
              زيارة
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => onEdit(customer, e)}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-tertiary)',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
              className="hover:text-amber-500 hover:border-amber-500 transition-colors"
              title="تعديل"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => onDelete(customer, e)}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-tertiary)',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
              className="hover:text-red-500 hover:border-red-500 transition-colors"
              title="حذف"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <ChevronLeft size={16} color="var(--color-text-secondary)" />
        </div>
      </div>
    </div>
  );
}

const Customers: React.FC = () => {
  const navigate = useNavigate();
  
  // Store States
  const customers = useStore((state) => state.customers);
  const cars = useStore((state) => state.cars);
  const visits = useStore((state) => state.visits);
  const addCustomer = useStore((state) => state.addCustomer);
  const updateCustomer = useStore((state) => state.updateCustomer);
  const deleteCustomer = useStore((state) => state.deleteCustomer);

  // Component States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Delete Confirmation State
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Find which customers have an open visit RIGHT NOW
  const activeVisitMap = useMemo(() => {
    const map: Record<string, Visit> = {};
    visits.forEach((v: Visit) => {
      if (
        v.status === 'received' ||
        v.status === 'in_progress' ||
        v.status === 'استقبلت' ||
        v.status === 'منتظر' ||
        v.status === 'قيد الفحص' ||
        v.status === 'قيد التنفيذ' ||
        v.status === 'Open' ||
        v.status === 'In Progress'
      ) {
        map[v.customerId] = v;
      }
    });
    return map;
  }, [visits]);

  // Filter customers based on search
  const filteredCustomers = customers.filter((c: Customer) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  // Sort: active customers FIRST, then by name
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      const aActive = !!activeVisitMap[a.id];
      const bActive = !!activeVisitMap[b.id];
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return a.name.localeCompare(b.name, 'ar');
    });
  }, [filteredCustomers, activeVisitMap]);

  // Pagination Logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const paginatedCustomers = sortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenAddDrawer = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click navigation
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address);
    setNotes(customer.notes);
    setIsDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('الاسم ورقم الهاتف حقول مطلوبة');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, { name, phone, address, notes });
      toast.success('تم تحديث بيانات الزبون بنجاح');
    } else {
      const newId = addCustomer({ name, phone, address, notes });
      toast.success('تم إضافة الزبون بنجاح');
      // Option to navigate directly to profile
      navigate(`/customers/${newId}`);
    }

    setIsDrawerOpen(false);
  };

  const handleDeleteClick = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click navigation
    setCustomerToDelete(customer);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      toast.success('تم حذف الزبون وكل بيانات سياراته بنجاح');
      setCustomerToDelete(null);
      // Adjust page index if necessary
      if (paginatedCustomers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const getCustomerStats = (customerId: string) => {
    const customerCars = cars.filter((c: Car) => c.customerId === customerId).length;
    const customerVisitsList = visits.filter((v: Visit) => v.customerId === customerId);
    const visitsCount = customerVisitsList.length;
    const totalDebt = customerVisitsList.reduce((sum: number, v: Visit) => sum + (v.totalRemaining || 0), 0);
    return { carsCount: customerCars, visitsCount, totalDebt };
  };

  const getInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).slice(0, 2).join('');
  };

  // Pastel backgrounds for avatars
  const avatarBgColors = [
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
  ];

  const getAvatarStyle = (customerId: string) => {
    // stable color based on string charCode sum
    const sum = customerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarBgColors[sum % avatarBgColors.length];
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
            الزبائن والعملاء
          </h1>
          {/* Active count */}
          {Object.keys(activeVisitMap).length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold font-cairo">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" style={{ animation: 'pulse 1.2s infinite' }} />
              <span>{Object.keys(activeVisitMap).length} عميل في المركز الآن</span>
            </div>
          )}
        </div>
      </div>

      {/* Upper Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-4 rounded-2xl shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="بحث باسم الزبون أو الهاتف..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-4 pr-10 py-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-brand-accent-dark focus:border-transparent text-right font-cairo text-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-brand-muted-light dark:text-brand-muted-dark">
            <Search className="w-4 h-4" />
          </div>
        </div>

        {/* Add Customer Button */}
        <button
          onClick={handleOpenAddDrawer}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-brand-accent-light dark:hover:bg-brand-accent-light/90 text-white flex items-center justify-center gap-2 text-sm font-semibold font-cairo shadow-lg shadow-indigo-600/10 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة زبون جديد</span>
        </button>

      </div>

      {/* Customers List Card Container */}
      <div className="space-y-4">
        {/* Active section header */}
        {Object.keys(activeVisitMap).length > 0 && paginatedCustomers.some(c => activeVisitMap[c.id]) && (
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-cairo px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" style={{ animation: 'pulse 1.2s infinite' }} />
            <span>في المركز الآن</span>
          </div>
        )}

        {paginatedCustomers.length > 0 ? (
          <div className="flex flex-col gap-3">
            {paginatedCustomers.map((customer: Customer, index: number) => {
              const activeVisit = activeVisitMap[customer.id];
              const isActive    = !!activeVisit;

              // Separator between active and normal
              const absoluteIndex = (currentPage - 1) * itemsPerPage + index;
              const prevIsActive = absoluteIndex > 0
                ? !!activeVisitMap[sortedCustomers[absoluteIndex - 1].id]
                : false;
              const showSeparator =
                !isActive && prevIsActive &&
                Object.keys(activeVisitMap).length > 0;

              return (
                <React.Fragment key={customer.id}>
                  {showSeparator && (
                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500 my-4 flex items-center gap-3 font-cairo px-1">
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                      <span>بقية الزبائن</span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    </div>
                  )}
                  <CustomerCard
                    customer={customer}
                    activeVisit={activeVisit}
                    isActive={isActive}
                    onEdit={handleOpenEditDrawer}
                    onDelete={handleDeleteClick}
                  />
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-8 rounded-2xl shadow-sm">
            <EmptyState
              title="لا يوجد زبائن مطابقين للبحث"
              description="أدخل اسماً أو رقم هاتف صحيح، أو قم بإضافة زبون جديد في النظام."
              actionLabel="إضافة زبون جديد"
              onAction={handleOpenAddDrawer}
              icon={<Users className="w-8 h-8" />}
            />
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-sm">
            <span className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">
              عرض الصفحة {currentPage} من أصل {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark hover:bg-indigo-50 dark:hover:bg-indigo-950/20 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark hover:bg-indigo-50 dark:hover:bg-indigo-950/20 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Drawer for Add/Edit Customer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-start">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            />

            {/* Drawer Container (Sliding from Left side since RTL, or we can slide from Left side) */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white dark:bg-brand-surface-dark h-full shadow-2xl flex flex-col z-10 text-right"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border-light dark:border-brand-border-dark">
                <h3 className="text-base font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
                  {editingCustomer ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد'}
                </h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg text-brand-muted-light dark:text-brand-muted-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSave} className="flex-1 p-6 overflow-y-auto space-y-5">
                
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-brand-accent-dark focus:border-transparent text-right font-cairo text-sm"
                    placeholder="مثل: محمد علي أحمد"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-semibold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-brand-accent-dark focus:border-transparent text-left direction-ltr text-sm"
                      placeholder="077XXXXXXXX"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-brand-muted-light dark:text-brand-muted-dark">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
                    العنوان
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-brand-accent-dark focus:border-transparent text-right font-cairo text-sm"
                      placeholder="مثل: بغداد، المنصور"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-brand-muted-light dark:text-brand-muted-dark">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
                    ملاحظات الزبون (اختياري)
                  </label>
                  <div className="relative">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-brand-accent-dark focus:border-transparent text-right font-cairo text-sm resize-none"
                      placeholder="أي تفاصيل إضافية عن الزبون أو تفضيلاته..."
                    />
                    <div className="absolute top-3 right-0 pr-3 text-brand-muted-light dark:text-brand-muted-dark">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons inside drawer */}
                <div className="pt-4 border-t border-brand-border-light dark:border-brand-border-dark flex items-center justify-between gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-brand-accent-light dark:hover:bg-brand-accent-light/90 text-white font-semibold font-cairo transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/10 text-center"
                  >
                    حفظ البيانات
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark text-brand-text-light dark:text-brand-text-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark font-medium font-cairo transition-all text-center"
                  >
                    إلغاء
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={customerToDelete !== null}
        onClose={() => setCustomerToDelete(null)}
        title="تأكيد حذف الزبون"
        size="sm"
      >
        <div className="space-y-4 text-right">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-8 h-8 shrink-0" />
            <div>
              <h4 className="font-bold font-cairo text-sm">هل أنت متأكد من الحذف؟</h4>
              <p className="text-xs font-cairo text-brand-muted-light dark:text-brand-muted-dark mt-0.5">
                سيؤدي هذا الإجراء إلى حذف الزبون ({customerToDelete?.name}) وكل سياراته وزياراته المسجلة نهائياً ولا يمكن الرجوع عنه.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-brand-border-light dark:border-brand-border-dark flex items-center justify-between gap-3">
            <button
              onClick={confirmDelete}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold font-cairo transition-all active:scale-[0.98] text-sm text-center shadow-lg shadow-red-600/10"
            >
              نعم، احذف الزبون
            </button>
            <button
              onClick={() => setCustomerToDelete(null)}
              className="flex-1 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark text-brand-text-light dark:text-brand-text-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark font-medium font-cairo transition-all text-sm text-center"
            >
              تراجع
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Customers;
