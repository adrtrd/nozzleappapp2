import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Car, 
  Activity, 
  Receipt, 
  Calendar, 
  Coins, 
  ChevronLeft,
  ArrowUpRight,
  Inbox,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { useStore, Visit, Invoice, Customer, Car as StoreCar, VisitService, Payment } from '../store/store';

// Helper to format numbers with commas and IQD
export const formatCurrency = (amount: number, currency = 'د.ع') => {
  return `${amount.toLocaleString('ar-IQ')} ${currency}`;
};

// Helper to format date into Arabic locale
export const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

const ARABIC_MONTHS = [
  'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
];

const COLORS = ['#6366F1', '#818CF8', '#A78BFA', '#F472B6', '#34D399', '#FBBF24', '#60A5FA'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const customers = useStore((state) => state.customers);
  const cars = useStore((state) => state.cars);
  const visits = useStore((state) => state.visits);
  const visitServices = useStore((state) => state.visitServices);
  const invoices = useStore((state) => state.invoices);
  const payments = useStore((state) => state.payments);
  const settings = useStore((state) => state.settings);

  // Alert computations
  const getAlerts = () => {
    const alertsList: { type: 'oil' | 'overdue_payment' | 'upcoming_payment'; title: string; desc: string; link: string }[] = [];

    // 1. Overdue payments & Upcoming payments
    payments.forEach((p: Payment) => {
      if (p.status !== 'paid') {
        const customer = customers.find((c: Customer) => c.id === p.customerId);
        const invoice = invoices.find((inv: Invoice) => inv.id === p.invoiceId);
        const customerName = customer ? customer.name : 'زبون';
        const invNum = invoice ? invoice.invoiceNumber : 'فاتورة';
        
        const today = new Date().toISOString().split('T')[0];
        const pDueDate = p.dueDate || '';
        const pRemainingAmount = p.remainingAmount || 0;
        if (pDueDate < today) {
          alertsList.push({
            type: 'overdue_payment',
            title: `دفعة متأخرة المستحق: ${customerName}`,
            desc: `الفاتورة ${invNum} متجاوزة موعد السداد منذ تاريخ ${formatDate(pDueDate)}. المتبقي: ${pRemainingAmount.toLocaleString('ar-IQ')} د.ع`,
            link: '/debts'
          });
        } else {
          const todayDate = new Date();
          const dueDateObj = new Date(pDueDate);
          const diffTime = dueDateObj.getTime() - todayDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 7) {
            alertsList.push({
              type: 'upcoming_payment',
              title: `دفعة مستحقة قريباً: ${customerName}`,
              desc: `الفاتورة ${invNum} مستحقة خلال ${diffDays} أيام بتاريخ ${formatDate(pDueDate)}. المتبقي: ${pRemainingAmount.toLocaleString('ar-IQ')} د.ع`,
              link: '/debts'
            });
          }
        }
      }
    });

    // 2. Oil changes due
    cars.forEach((car: StoreCar) => {
      const customer = customers.find((c: Customer) => c.id === car.customerId);
      const customerName = customer ? customer.name : 'زبون';
      const carVisitIds = visits.filter((v: Visit) => v.carId === car.id).map((v: Visit) => v.id);
      
      const oilServicesForCar = visitServices.filter((vs: VisitService) => 
        carVisitIds.includes(vs.visitId) && 
        vs.oilDetails && 
        vs.oilDetails.nextChangeOdometer
      );

      if (oilServicesForCar.length > 0) {
        const latestOilService = oilServicesForCar.reduce((latest: VisitService, current: VisitService) => {
          const lOdo = latest.oilDetails?.nextChangeOdometer || 0;
          const cOdo = current.oilDetails?.nextChangeOdometer || 0;
          return cOdo > lOdo ? current : latest;
        }, oilServicesForCar[0]);

        const nextOdo = latestOilService.oilDetails?.nextChangeOdometer || 0;
        const nextDate = latestOilService.oilDetails?.nextChangeDate;

        if (nextOdo > 0) {
          const diffOdo = nextOdo - car.odometer;
          if (diffOdo <= 500) {
            let desc = `العداد الحالي للسيارة ${car.brand} ${car.name} هو ${car.odometer.toLocaleString('ar-IQ')} كم، والتبديل مستحق عند ${nextOdo.toLocaleString('ar-IQ')} كم.`;
            if (nextDate) {
              desc += ` (الموعد: ${formatDate(nextDate)})`;
            }
            alertsList.push({
              type: 'oil',
              title: `استحقاق تغيير زيت: ${customerName} (${car.brand} ${car.name})`,
              desc,
              link: `/customers/${car.customerId}`
            });
          }
        }
      }
    });

    return alertsList;
  };

  const dashboardAlerts = getAlerts();

  // Stats Calculations
  const totalCustomers = customers.length;
  const totalCars = cars.length;
  const activeVisits = visits.filter((v: Visit) => v.status === 'Open' || v.status === 'In Progress').length;
  const totalRevenue = invoices.reduce((sum: number, inv: Invoice) => sum + inv.total, 0);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const visitsToday = visits.filter((v: Visit) => v.entryDate === todayStr).length;
  const totalInvoices = invoices.length;

  // Chart 1: Last 6 months revenue & visits
  // Let's generate the last 6 months keys
  const getChartData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth(); // 0-11
      const monthNum = monthIndex + 1; // 1-12
      const monthLabel = ARABIC_MONTHS[monthIndex];
      
      const monthPrefix = `${year}-${String(monthNum).padStart(2, '0')}`;
      
      // Filter invoices in this month
      const monthInvoices = invoices.filter((inv: Invoice) => inv.issuedAt.startsWith(monthPrefix));
      const revenue = monthInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total, 0);
      
      // Filter visits in this month
      const monthVisitsCount = visits.filter((v: Visit) => v.entryDate.startsWith(monthPrefix)).length;
      
      data.push({
        name: monthLabel,
        'الإيرادات (د.ع)': revenue,
        'الزيارات': monthVisitsCount,
        revenueFormatted: formatCurrency(revenue, settings.currency)
      });
    }
    return data;
  };

  const chartData = getChartData();

  // Chart 2: Top services by usage count
  const getTopServicesData = () => {
    const serviceCounts: Record<string, { name: string; value: number }> = {};
    
    visitServices.forEach((vs: VisitService) => {
      if (serviceCounts[vs.serviceName]) {
        serviceCounts[vs.serviceName].value += vs.qty;
      } else {
        serviceCounts[vs.serviceName] = { name: vs.serviceName, value: vs.qty };
      }
    });
    
    // Sort and take top 5
    const sorted = Object.values(serviceCounts)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
      
    return sorted;
  };

  const topServicesData = getTopServicesData();

  // Recent 10 visits
  const recentVisits = [...visits]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const getVisitCustomerName = (visit: Visit) => {
    const cust = customers.find((c: Customer) => c.id === visit.customerId);
    return cust ? cust.name : 'زبون غير معروف';
  };

  const getVisitCarName = (visit: Visit) => {
    const car = cars.find((c: StoreCar) => c.id === visit.carId);
    return car ? `${car.brand} ${car.name}` : 'سيارة غير معروفة';
  };

  const getVisitTotal = (visit: Visit) => {
    const inv = invoices.find((i: Invoice) => i.visitId === visit.id);
    if (inv) return formatCurrency(inv.total, settings.currency);
    
    // Calculate estimated subtotal from current visit services if no invoice
    const vsList = visitServices.filter((vs: VisitService) => vs.visitId === visit.id);
    const subtotal = vsList.reduce((sum: number, item: VisitService) => sum + (item.unitPrice * item.qty), 0);
    return subtotal > 0 ? `~ ${formatCurrency(subtotal, settings.currency)}` : '-';
  };

  // Stats Card Animation Config
  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3 }
    })
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
            مرحباً بك في لوحة التحكم 👋
          </h2>
          <p className="text-brand-muted-light dark:text-brand-muted-dark text-sm mt-1 font-cairo">
            مستودع البيانات العام لمركز الخدمة اليوم: {formatDate(todayStr)}
          </p>
        </div>
      </div>

      {/* Alerts Panel */}
      {dashboardAlerts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-red-600 dark:text-red-400 font-cairo flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            <span>تنبيهات وإشعارات النظام العاجلة ({dashboardAlerts.length})</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardAlerts.slice(0, 6).map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate(alert.link)}
                className={`p-4 rounded-2xl border flex flex-col justify-between shadow-sm font-cairo transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]
                  ${
                    alert.type === 'overdue_payment'
                      ? 'bg-red-50/70 dark:bg-red-950/10 border-red-200 dark:border-red-900/40 text-red-950 dark:text-red-300'
                      : alert.type === 'upcoming_payment'
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-900/40 text-indigo-950 dark:text-indigo-300'
                      : 'bg-amber-50/70 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-300'
                  }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5
                    ${
                      alert.type === 'overdue_payment'
                        ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                        : alert.type === 'upcoming_payment'
                        ? 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                        : 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold leading-normal">{alert.title}</h5>
                    <p className="text-[10px] opacity-80 leading-relaxed">{alert.desc}</p>
                  </div>
                </div>
                <div className="flex justify-end mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[9px] font-bold text-indigo-600 dark:text-brand-accent-light">
                  <span>المتابعة والتفاصيل ←</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { title: 'إجمالي الزبائن', value: totalCustomers, icon: Users, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' },
          { title: 'السيارات المسجلة', value: totalCars, icon: Car, color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/20' },
          { title: 'الزيارات النشطة', value: activeVisits, icon: Activity, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20' },
          { title: 'إجمالي الإيرادات', value: formatCurrency(totalRevenue, settings.currency), icon: Coins, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20', isCurrency: true },
          { title: 'زيارات اليوم', value: visitsToday, icon: Calendar, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20' },
          { title: 'الفواتير الصادرة', value: totalInvoices, icon: Receipt, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' },
        ].map((card, index) => (
          <motion.div
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            key={card.title}
            className="p-5 rounded-2xl bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-brand-muted-light dark:text-brand-muted-dark font-cairo">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-brand-text-light dark:text-brand-text-dark font-cairo tracking-tight ${card.isCurrency ? 'text-lg md:text-xl' : 'text-2xl'}`}>
                {card.value}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue (Bar Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
              حجم الإيرادات الشهرية
            </h3>
            <span className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">
              آخر 6 أشهر ({settings.currency})
            </span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} width={80} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value, settings.currency), 'الإيرادات']} 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #E2E8F0', 
                    fontSize: '12px',
                    fontFamily: 'Cairo',
                    textAlign: 'right' 
                  }} 
                />
                <Bar dataKey="الإيرادات (د.ع)" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Services (Donut/Pie Chart) */}
        <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-brand-text-light dark:text-brand-text-dark font-cairo mb-6">
            أكثر الخدمات طلباً
          </h3>
          <div className="h-56 w-full relative flex-1">
            {topServicesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topServicesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {topServicesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [value, 'مرات الاستخدام']}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #E2E8F0', 
                      fontSize: '12px',
                      fontFamily: 'Cairo',
                      textAlign: 'right' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">لا توجد بيانات خدمات متوفرة</p>
              </div>
            )}
          </div>
          
          {/* Legend list */}
          <div className="mt-4 space-y-2">
            {topServicesData.map((item, idx) => (
              <div className="flex items-center justify-between text-xs" key={item.name}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="font-cairo text-brand-text-light dark:text-brand-text-dark font-medium truncate max-w-[150px]">{item.name}</span>
                </div>
                <span className="font-semibold text-brand-muted-light dark:text-brand-muted-dark font-cairo">{item.value} مرة</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Third row: Line Chart of Visits + Recent Activity Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Visits Trend (Line Chart) */}
        <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
              معدل زيارات المركز
            </h3>
            <span className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">
              آخر 6 أشهر
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #E2E8F0', 
                    fontSize: '12px',
                    fontFamily: 'Cairo',
                    textAlign: 'right' 
                  }} 
                />
                <Line type="monotone" dataKey="الزيارات" stroke="#818CF8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity (Visits Table) */}
        <div className="lg:col-span-2 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
              آخر النشاطات (الزيارات الأخيرة)
            </h3>
            <button
              onClick={() => navigate('/visits')}
              className="text-xs font-semibold text-indigo-600 dark:text-brand-accent-dark hover:underline flex items-center gap-1 font-cairo"
            >
              عرض الكل
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentVisits.length > 0 ? (
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-brand-border-light dark:border-brand-border-dark text-xs text-brand-muted-light dark:text-brand-muted-dark font-semibold font-cairo pb-3">
                    <th className="pb-3 text-right">الزبون</th>
                    <th className="pb-3 text-right">السيارة</th>
                    <th className="pb-3 text-right">التاريخ</th>
                    <th className="pb-3 text-right">الحالة</th>
                    <th className="pb-3 text-right">المبلغ</th>
                    <th className="pb-3 text-left">التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border-light dark:divide-brand-border-dark/60 text-sm">
                  {recentVisits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark/50 transition-colors">
                      <td className="py-3 font-semibold text-brand-text-light dark:text-brand-text-dark font-cairo">
                        {getVisitCustomerName(visit)}
                      </td>
                      <td className="py-3 text-brand-muted-light dark:text-brand-muted-dark font-cairo">
                        {getVisitCarName(visit)}
                      </td>
                      <td className="py-3 text-xs text-brand-muted-light dark:text-brand-muted-dark">
                        {formatDate(visit.entryDate)}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold font-cairo
                          ${
                            visit.status === 'Open'
                              ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                              : visit.status === 'In Progress'
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                              : visit.status === 'Completed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {visit.status === 'Open' && 'مفتوحة'}
                          {visit.status === 'In Progress' && 'قيد العمل'}
                          {visit.status === 'Completed' && 'مكتملة'}
                          {visit.status === 'Cancelled' && 'ملغاة'}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-brand-text-light dark:text-brand-text-dark">
                        {getVisitTotal(visit)}
                      </td>
                      <td className="py-3 text-left">
                        <button
                          onClick={() => navigate(`/visits/${visit.id}`)}
                          className="p-1.5 rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-brand-accent-dark transition-colors inline-flex items-center gap-1 text-xs font-semibold font-cairo"
                        >
                          عرض
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Inbox className="w-12 h-12 text-brand-muted-light dark:text-brand-muted-dark mb-3" />
                <p className="text-sm text-brand-muted-light dark:text-brand-muted-dark font-cairo">لا توجد زيارات مسجلة مؤخراً</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
