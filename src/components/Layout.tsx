import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  ClipboardList, 
  Settings as SettingsIcon, 
  LogOut, 
  Sun, 
  Moon, 
  ChevronDown, 
  User as UserIcon,
  ChevronLeft,
  Menu,
  X,
  Coins,
  BarChart3,
  Search,
  Bell,
  Check,
  AlertTriangle,
  Clock,
  Car as CarIcon,
  FileText
} from 'lucide-react';
import { useStore, Customer, Car, Visit, Invoice, Notification } from '../store/store';
import ToastContainer from './Toast';
import { toast } from '../store/toastStore';
import { useVisitStore } from '../store/useVisitStore';

function ActiveVisitBanner() {
  const visits = useVisitStore((s) => s.visits);
  const navigate = useNavigate();

  // Visits that are open (not done/delivered/completed)
  const openVisits = visits.filter((v) =>
    v.status === 'received' || v.status === 'in_progress' ||
    v.status === 'منتظر' || v.status === 'استقبلت' ||
    v.status === 'قيد الفحص' || v.status === 'قيد التنفيذ'
  );

  if (openVisits.length === 0) return null;

  return (
    <div style={{
      background: 'linear-gradient(to left, #F59E0B, #D97706)',
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      direction: 'rtl',
      zIndex: 100,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{
          width: '8px', height: '8px',
          borderRadius: '50%', background: '#fff',
          animation: 'pulse 1.5s infinite',
        }} />
        <span style={{
          color: '#fff', fontWeight: '600', fontSize: '14px',
        }}>
          {openVisits.length === 1
            ? `زيارة مفتوحة: ${openVisits[0].id.substring(0, 8)}`
            : `${openVisits.length} زيارات مفتوحة`}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {openVisits.slice(0, 3).map((v) => (
          <button
            key={v.id}
            onClick={() => navigate(`/visits/${v.id}`)}
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '6px',
              padding: '4px 12px',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            {v.id.substring(0, 8)} — {
              v.status === 'received' || v.status === 'استقبلت' ? 'استُقبلت' :
              v.status === 'in_progress' || v.status === 'قيد التنفيذ' ? 'قيد التنفيذ' :
              v.status === 'منتظر' ? 'منتظر' :
              v.status === 'قيد الفحص' ? 'قيد الفحص' : ''
            }
          </button>
        ))}
        {openVisits.length > 3 && (
          <button
            onClick={() => navigate('/visits')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '6px',
              padding: '4px 10px',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            +{openVisits.length - 3} أخرى
          </button>
        )}
      </div>
    </div>
  );
}

const Layout: React.FC = () => {
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const settings = useStore((state) => state.settings);
  
  // Sub-stores data for Command Palette search
  const customers = useStore((state) => state.customers) || [];
  const cars = useStore((state) => state.cars) || [];
  const visits = useStore((state) => state.visits) || [];
  const invoices = useStore((state) => state.invoices) || [];
  const services = useStore((state) => state.services) || [];

  // Notifications store data
  const notifications = useStore((state) => state.notifications) || [];
  const markAsRead = useStore((state) => state.markAsRead);
  const markAllAsRead = useStore((state) => state.markAllAsRead);
  const dismissNotification = useStore((state) => state.dismissNotification);

  const navigate = useNavigate();
  const location = useLocation();
  
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);
  
  // Command Palette State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);

  // Apply dark class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Command palette keyboard listener (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'الرئيسية';
    if (path.startsWith('/customers')) return 'الزبائن';
    if (path.startsWith('/visits')) return 'الزيارات';
    if (path.startsWith('/settings')) return 'الإعدادات';
    if (path.startsWith('/debts')) return 'متابعة الديون';
    if (path.startsWith('/reports')) return 'التقارير التحليلية';
    return '';
  };

  const menuItems = [
    { name: 'الرئيسية', path: '/', icon: LayoutDashboard, roles: ['admin', 'technician', 'receptionist', 'accountant'] },
    { name: 'الزبائن', path: '/customers', icon: Users, roles: ['admin', 'receptionist', 'accountant'] },
    { name: 'الزيارات', path: '/visits', icon: ClipboardList, roles: ['admin', 'technician', 'receptionist', 'accountant'] },
    { name: 'متابعة الديون', path: '/debts', icon: Coins, roles: ['admin', 'receptionist', 'accountant'] },
    { name: 'التقارير التحليلية', path: '/reports', icon: BarChart3, roles: ['admin', 'accountant'] },
    { name: 'الإعدادات', path: '/settings', icon: SettingsIcon, roles: ['admin'] }
  ];

  // Filter menu items by user role
  const allowedMenuItems = menuItems.filter(item => 
    !currentUser || item.roles.includes(currentUser.role)
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  };

  const getRoleLabel = (role: string) => {
    if (!role) return '';
    const r = role.toLowerCase();
    if (r === 'admin') return 'مدير النظام';
    if (r === 'technician') return 'فني صيانة';
    if (r === 'receptionist') return 'موظف استقبال';
    if (r === 'accountant') return 'المحاسب المالي';
    return role;
  };

  // Command palette search math
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    const matchedCustomers = customers.filter((c: Customer) => c.name.toLowerCase().includes(q) || c.phone.includes(q)).map((c: Customer) => ({
      type: 'customer',
      title: c.name,
      subtitle: `زبون | هاتف: ${c.phone}`,
      link: `/customers/${c.id}`
    }));

    const matchedCars = cars.filter((c: Car) => c.name.toLowerCase().includes(q) || c.brand.toLowerCase().includes(q) || c.plateNumber.includes(q)).map((c: Car) => ({
      type: 'car',
      title: `${c.brand} ${c.name}`,
      subtitle: `سيارة | لوحة: ${c.plateNumber}`,
      link: `/customers/${c.customerId}` // routes to customer profile
    }));

    const matchedInvoices = invoices.filter((inv: Invoice) => inv.invoiceNumber.toLowerCase().includes(q)).map((inv: Invoice) => ({
      type: 'invoice',
      title: `فاتورة ${inv.invoiceNumber}`,
      subtitle: `فاتورة مبيعات بقيمة: ${inv.total.toLocaleString('ar-IQ')} د.ع`,
      link: `/visits/${inv.visitId}`
    }));

    const matchedVisits = visits.filter((v: Visit) => (v.notes || '').toLowerCase().includes(q)).map((v: Visit) => {
      const c = cars.find((car: Car) => car.id === v.carId);
      return {
        type: 'visit',
        title: `زيارة صيانة سيارة ${c ? c.name : ''}`,
        subtitle: `تفاصيل: ${v.notes || ''}`,
        link: `/visits/${v.id}`
      };
    });

    return [...matchedCustomers, ...matchedCars, ...matchedInvoices, ...matchedVisits].slice(0, 10);
  }, [searchQuery, customers, cars, invoices, visits]);

  const handlePaletteSelect = (link: string) => {
    navigate(link);
    setCommandPaletteOpen(false);
    setSearchQuery('');
  };

  // Unread notifications count
  const unreadNotifications = notifications.filter((n: Notification) => !n.isRead);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg-light dark:bg-brand-bg-dark transition-colors duration-200">
      
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Desktop Sidebar (RTL: right side) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-brand-surface-dark border-l border-brand-border-light dark:border-brand-border-dark shrink-0">
        <div className="flex items-center gap-3 p-6 border-b border-brand-border-light dark:border-brand-border-dark">
          <div className="w-10 h-10 bg-indigo-600 dark:bg-brand-accent-dark rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/10">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-brand-text-light dark:text-brand-text-dark font-cairo truncate max-w-[150px]">
              {settings.centerName || 'مركز نوزل'}
            </h2>
            <span className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">
              نظام إدارة الخدمات
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allowedMenuItems.map((item) => {
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold font-cairo transition-all group ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-brand-accent-dark'
                    : 'text-brand-muted-light dark:text-brand-muted-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark hover:text-brand-text-light dark:hover:text-brand-text-dark'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-600 dark:text-brand-accent-dark' : ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-brand-border-light dark:border-brand-border-dark">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold font-cairo text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15 transition-all group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-64 bg-white dark:bg-brand-surface-dark h-full flex flex-col border-r border-brand-border-light dark:border-brand-border-dark"
            >
              <div className="flex items-center justify-between p-6 border-b border-brand-border-light dark:border-brand-border-dark">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 dark:bg-brand-accent-dark rounded-lg flex items-center justify-center text-white">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-sm text-brand-text-light dark:text-brand-text-dark font-cairo">
                    {settings.centerName || 'مركز نوزل'}
                  </h2>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-brand-muted-light dark:text-brand-muted-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {allowedMenuItems.map((item) => {
                  const isActive = item.path === '/' 
                    ? location.pathname === '/' 
                    : location.pathname.startsWith(item.path);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold font-cairo transition-all ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-brand-accent-dark'
                          : 'text-brand-muted-light dark:text-brand-muted-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark hover:text-brand-text-light dark:hover:text-brand-text-dark'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-brand-border-light dark:border-brand-border-dark">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold font-cairo text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 border-b border-brand-border-light dark:border-brand-border-dark bg-white dark:bg-brand-surface-dark flex items-center justify-between px-6 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-brand-muted-light dark:text-brand-muted-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-black text-brand-text-light dark:text-brand-text-dark font-cairo">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Command Palette trigger */}
            <button
              onClick={() => {
                setCommandPaletteOpen(true);
                setSearchQuery('');
              }}
              className="p-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-muted-light hover:text-indigo-600 dark:text-brand-muted-dark dark:hover:text-brand-accent-dark transition-all flex items-center gap-1.5"
              title="البحث الذكي (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline text-[9px] font-bold font-cairo bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Ctrl + K</span>
            </button>

            {/* Notifications Bell Dropdown */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellDropdownOpen(!bellDropdownOpen)}
                className="relative p-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-muted-light hover:text-indigo-600 dark:text-brand-muted-dark dark:hover:text-brand-accent-dark transition-all"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white leading-none">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {bellDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-2 w-72 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark shadow-2xl rounded-xl p-3 z-50 text-right font-cairo"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-brand-border-light dark:border-brand-border-dark">
                      <span className="text-xs font-black">🔔 الإشعارات الواردة</span>
                      {unreadNotifications.length > 0 && (
                        <button 
                          onClick={() => {
                            markAllAsRead();
                            toast.success('تم تحديد الكل كمقروء');
                          }} 
                          className="text-[9px] font-bold text-indigo-600 dark:text-brand-accent-dark hover:underline"
                        >
                          تحديد الكل كمقروء
                        </button>
                      )}
                    </div>

                    <div className="max-h-[250px] overflow-y-auto divide-y divide-brand-border-light dark:divide-brand-border-dark mt-2">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-[10px] text-slate-400">لا توجد إشعارات حالية.</div>
                      ) : (
                        notifications.map((n: Notification) => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              markAsRead(n.id);
                              setBellDropdownOpen(false);
                              if (n.relatedId) {
                                if (n.type === 'debt') navigate(`/customers/${n.relatedId}`);
                                if (n.type === 'reminder') navigate(`/customers/${n.relatedId}`);
                                if (n.type === 'visit') navigate(`/visits/${n.relatedId}`);
                              }
                            }}
                            className={`p-2 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer rounded-lg text-right transition-colors ${!n.isRead ? 'bg-slate-50/50 dark:bg-slate-900/10' : ''}`}
                          >
                            <div className="flex justify-between items-start">
                              <strong className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{n.title}</strong>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissNotification(n.id);
                                }} 
                                className="text-[9px] text-red-500 hover:text-red-700"
                              >
                                حذف
                              </button>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-1 leading-normal">{n.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-muted-light hover:text-indigo-600 dark:text-brand-muted-dark dark:hover:text-brand-accent-dark transition-all"
              title="تبديل المظهر"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Dropdown */}
            {currentUser && (() => {
              const roleLabels: Record<string, { label: string; color: string }> = {
                admin:        { label: 'مدير النظام', color: '#6366F1' },
                receptionist: { label: 'استقبال',    color: '#3B82F6' },
                technician:   { label: 'فني صيانة',  color: '#16A34A' },
                accountant:   { label: 'المحاسب المالي', color: '#D97706' },
              };
              const roleInfo = roleLabels[currentUser.role.toLowerCase()] || { label: currentUser.role, color: '#6366F1' };
              
              return (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-brand-border-light dark:border-brand-border-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark transition-all"
                  >
                    <span className="hidden sm:inline text-xs font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
                      {currentUser.name}
                    </span>
                    <div 
                      className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-xs font-cairo shadow-sm"
                      style={{ backgroundColor: roleInfo.color }}
                    >
                      {getInitials(currentUser.name)}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-brand-muted-light transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2 w-56 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark shadow-xl rounded-xl p-2 z-50 text-right"
                      >
                        <div className="px-3 py-2.5 border-b border-brand-border-light dark:border-brand-border-dark">
                          <p className="text-sm font-bold text-brand-text-light dark:text-brand-text-dark font-cairo leading-none">
                            {currentUser.name}
                          </p>
                          <p 
                            className="text-xs font-cairo font-semibold mt-1"
                            style={{ color: roleInfo.color }}
                          >
                            {roleInfo.label}
                          </p>
                        <p className="text-[10px] text-brand-muted-light dark:text-brand-muted-dark font-cairo mt-0.5 truncate font-mono">
                          {currentUser.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            navigate('/settings');
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium font-cairo text-brand-text-light dark:text-brand-text-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-brand-muted-light" />
                          <span>الملف الشخصي والإعدادات</span>
                        </button>
                      </div>

                      <div className="border-t border-brand-border-light dark:border-brand-border-dark py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium font-cairo text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>تسجيل الخروج</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              );
            })()}
          </div>
        </header>

        {/* Active Visit Banner */}
        <ActiveVisitBanner />

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto bg-brand-surface-light dark:bg-brand-bg-dark p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-[1600px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ================= COMMAND PALETTE SEARCH DIALOG ================= */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setCommandPaletteOpen(false)}
              className="fixed inset-0 bg-slate-900"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              className="relative w-full max-w-xl bg-white dark:bg-brand-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 flex flex-col font-cairo text-right"
            >
              {/* Search Box */}
              <div className="relative border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  ref={paletteInputRef}
                  type="text"
                  placeholder="ابحث عن: زبائن، سيارات، فواتير، زيارات صيانة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-slate-800 dark:text-slate-100 text-sm focus:outline-none text-right font-cairo"
                  autoFocus
                />
                <button 
                  onClick={() => setCommandPaletteOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded"
                >
                  ESC
                </button>
              </div>

              {/* Results area */}
              <div className="max-h-[350px] overflow-y-auto mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {!searchQuery.trim() ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    ابدأ في كتابة أي اسم أو هاتف أو رقم لوحة أو فاتورة للبحث السريع...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>عذراً، لا توجد نتائج مطابقة لبحثك الجاري.</span>
                  </div>
                ) : (
                  searchResults.map((res: any, index: number) => (
                    <div
                      key={index}
                      onClick={() => handlePaletteSelect(res.link)}
                      className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer rounded-xl flex items-center justify-between transition-colors ${
                        selectedIndex === index ? 'bg-slate-50 dark:bg-slate-900' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-indigo-600 dark:text-brand-accent-dark">
                          {res.type === 'customer' && <Users className="w-4 h-4" />}
                          {res.type === 'car' && <CarIcon className="w-4 h-4" />}
                          {res.type === 'invoice' && <FileText className="w-4 h-4" />}
                          {res.type === 'visit' && <ClipboardList className="w-4 h-4" />}
                        </div>
                        <div>
                          <strong className="text-xs text-slate-800 dark:text-slate-200">{res.title}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{res.subtitle}</span>
                        </div>
                      </div>

                      <ChevronLeft className="w-4 h-4 text-slate-300" />
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Layout;
