import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
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
import { 
  Calendar, 
  TrendingUp, 
  Wrench, 
  UserCheck, 
  Coins, 
  Car as CarIcon, 
  Users, 
  Download, 
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { useStore, Visit, Invoice, VisitService, User, Payment, Customer, Car } from '../store/store';
import { toast } from '../store/toastStore';

const formatCurrency = (val: number, curr = 'د.ع') => {
  return `${val.toLocaleString('ar-IQ')} ${curr}`;
};

const Reports: React.FC = () => {
  const visits = useStore((state) => state.visits) || [];
  const visitServices = useStore((state) => state.visitServices) || [];
  const invoices = useStore((state) => state.invoices) || [];
  const payments = useStore((state) => state.payments) || [];
  const customers = useStore((state) => state.customers) || [];
  const cars = useStore((state) => state.cars) || [];
  const users = useStore((state) => state.users) || [];
  const settings = useStore((state) => state.settings) || { currency: 'د.ع' };

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Active Report Tab
  const [activeReport, setActiveReport] = useState<'revenue' | 'services' | 'techs' | 'debts' | 'cars'>('revenue');

  // Filtered invoices & visits within selected range
  const filteredVisits = useMemo(() => {
    return visits.filter((v: Visit) => v.entryDate >= startDate && v.entryDate <= endDate);
  }, [visits, startDate, endDate]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv: Invoice) => inv.issuedAt >= startDate && inv.issuedAt <= endDate);
  }, [invoices, startDate, endDate]);

  // 1. Revenue report math
  const revenueReportData = useMemo(() => {
    const daily: Record<string, number> = {};
    
    // Fill in days
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      daily[d.toISOString().split('T')[0]] = 0;
    }

    filteredInvoices.forEach((inv: Invoice) => {
      if (daily[inv.issuedAt] !== undefined) {
        daily[inv.issuedAt] += inv.total;
      }
    });

    return Object.entries(daily)
      .map(([date, total]) => ({
        تاريخ: date,
        المبيعات: total
      }))
      .sort((a, b) => a.تاريخ.localeCompare(b.تاريخ));
  }, [filteredInvoices, startDate, endDate]);

  const totalSales = useMemo(() => {
    return filteredInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total, 0);
  }, [filteredInvoices]);

  // 2. Services popularity report math
  const servicesReportData = useMemo(() => {
    const counts: Record<string, { count: number; total: number }> = {};
    const filteredVisitIds = new Set(filteredVisits.map((v: Visit) => v.id));
    
    visitServices.forEach((vs: VisitService) => {
      if (filteredVisitIds.has(vs.visitId)) {
        const name = vs.serviceName;
        if (!counts[name]) {
          counts[name] = { count: 0, total: 0 };
        }
        counts[name].count += vs.qty;
        counts[name].total += vs.totalPrice;
      }
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        الخدمة: name,
        المرات: data.count,
        الإيراد: data.total
      }))
      .sort((a, b) => b.المرات - a.المرات)
      .slice(0, 10);
  }, [filteredVisits, visitServices]);

  // 3. Technician performance report math
  const techReportData = useMemo(() => {
    const performance: Record<string, { count: number; total: number }> = {};
    
    filteredVisits.forEach((v: Visit) => {
      const tech = users.find((u: User) => u.id === v.technicianId);
      const name = tech ? tech.name : 'فني غير محدد';
      const inv = invoices.find((i: Invoice) => i.visitId === v.id);
      
      if (!performance[name]) {
        performance[name] = { count: 0, total: 0 };
      }
      performance[name].count += 1;
      if (inv) {
        performance[name].total += inv.total;
      }
    });

    return Object.entries(performance).map(([name, data]) => ({
      الفني: name,
      الزيارات: data.count,
      القيمة: data.total
    }));
  }, [filteredVisits, users, invoices]);

  // 4. Pending debts report math
  const debtsReportData = useMemo(() => {
    return payments
      .filter((p: Payment) => (p.remainingAmount || 0) > 0)
      .map((p: Payment) => {
        const cust = customers.find((c: Customer) => c.id === p.customerId);
        return {
          الزبون: cust ? cust.name : 'محذوف',
          الهاتف: cust ? cust.phone : '-',
          الفاتورة: invoices.find((i: Invoice) => i.id === p.invoiceId)?.invoiceNumber || '-',
          المبلغ: p.totalAmount || 0,
          المدفوع: p.paidAmount || 0,
          المتبقي: p.remainingAmount || 0,
          الاستحقاق: p.dueDate
        };
      })
      .sort((a: any, b: any) => (a.الاستحقاق || '').localeCompare(b.الاستحقاق || ''));
  }, [payments, customers, invoices]);

  const totalOutstandingDebts = useMemo(() => {
    return debtsReportData.reduce((sum: number, p: any) => sum + p.المتبقي, 0);
  }, [debtsReportData]);

  // 5. Cars by category report math
  const carsReportData = useMemo(() => {
    const cats: Record<string, number> = {};
    cars.forEach((car: Car) => {
      cats[car.category] = (cats[car.category] || 0) + 1;
    });

    return Object.entries(cats).map(([name, val]) => ({
      النوع: name === 'Sedan' ? 'صالون' : name === 'SUV' ? 'جيب عائلي' : name === 'Pickup' ? 'بيك أب' : name === 'Van' ? 'باص' : name === 'Luxury' ? 'رياضي فارهة' : 'أخرى',
      العدد: val
    }));
  }, [cars]);

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6'];

  // Excel / CSV Export
  const handleExportCSV = (reportName: string, data: any[]) => {
    if (data.length === 0) {
      toast.warning('لا توجد بيانات لتصديرها');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nozzle_${reportName}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('تم تصدير التقرير كملف Excel/CSV بنجاح');
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Header and filters */}
      <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-black font-cairo text-brand-text-light dark:text-brand-text-dark leading-none">
            📊 التقارير التحليلية والمالية
          </h2>

          {/* Date range picker */}
          <div className="flex items-center gap-3 font-cairo text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">من تاريخ:</span>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono text-center"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">إلى تاريخ:</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 border-b border-brand-border-light dark:border-brand-border-dark pb-px">
        {[
          { label: '💰 المبيعات والأرباح', value: 'revenue', icon: TrendingUp },
          { label: '🔧 الخدمات الأكثر طلباً', value: 'services', icon: Wrench },
          { label: '👤 تقييم الفنيين صيانة', value: 'techs', icon: UserCheck },
          { label: '🔴 الديون والذمم المعلقة', value: 'debts', icon: Coins },
          { label: '🚗 تصنيفات هياكل السيارات', value: 'cars', icon: CarIcon }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveReport(tab.value as any)}
              className={`px-4 py-3 font-bold font-cairo text-xs border-b-2 flex items-center justify-center gap-2 transition-all leading-none ${
                activeReport === tab.value
                  ? 'border-indigo-600 text-indigo-600 dark:border-brand-accent-dark dark:text-brand-accent-dark'
                  : 'border-transparent text-brand-muted-light dark:text-brand-muted-dark hover:text-brand-text-light dark:hover:text-brand-text-dark'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div>
        {/* ================= REVENUE REPORT ================= */}
        {activeReport === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-sm text-center">
                <span className="text-xs text-slate-400 block font-cairo">المبيعات الإجمالية بالفترة</span>
                <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">{formatCurrency(totalSales)}</span>
              </div>
              <div className="p-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-sm text-center">
                <span className="text-xs text-slate-400 block font-cairo">عدد الفواتير الصادرة</span>
                <span className="text-xl font-black text-indigo-600 dark:text-brand-accent-dark font-mono">{filteredInvoices.length} فاتورة</span>
              </div>
              <div className="p-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-sm text-center">
                <span className="text-xs text-slate-400 block font-cairo">متوسط قيمة الفاتورة</span>
                <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {formatCurrency(filteredInvoices.length > 0 ? Math.round(totalSales / filteredInvoices.length) : 0)}
                </span>
              </div>
            </div>

            {/* Line chart */}
            <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-brand-border-light dark:border-brand-border-dark pb-3">
                <span className="text-xs font-bold font-cairo text-slate-700 dark:text-slate-200">📈 مخطط المبيعات والإيرادات اليومي خلال المدة</span>
                <button 
                  onClick={() => handleExportCSV('revenue', revenueReportData)}
                  className="text-xs font-bold font-cairo text-indigo-600 dark:text-brand-accent-dark flex items-center gap-1 hover:underline"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير لملف Excel</span>
                </button>
              </div>
              
              <div className="h-72 font-sans text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueReportData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="تاريخ" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="المبيعات" stroke="#6366F1" strokeWidth={3} name="المبيعات (د.ع)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-cairo">📋 جدول الإيرادات التفصيلي</span>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs font-cairo">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">المبيعات اليومية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border-light dark:divide-brand-border-dark font-mono text-xs">
                    {revenueReportData.map((row) => (
                      <tr key={row.تاريخ} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-3 font-cairo">{row.تاريخ}</td>
                        <td className="p-3 font-bold text-indigo-600 dark:text-brand-accent-dark">{formatCurrency(row.المبيعات)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= SERVICES REPORT ================= */}
        {activeReport === 'services' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-brand-border-light dark:border-brand-border-dark pb-3">
                <span className="text-xs font-bold font-cairo text-slate-700 dark:text-slate-200">📊 رسم بياني للخدمات والمنتجات الأكثر طلباً</span>
                <button 
                  onClick={() => handleExportCSV('services', servicesReportData)}
                  className="text-xs font-bold font-cairo text-indigo-600 dark:text-brand-accent-dark flex items-center gap-1 hover:underline"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير لملف Excel</span>
                </button>
              </div>

              {servicesReportData.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 font-cairo">لا توجد خدمات منجزة بالفترة المحددة.</div>
              ) : (
                <div className="h-72 font-sans text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={servicesReportData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="الخدمة" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="المرات" fill="#10B981" name="مرات طلب الخدمة" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-cairo">📋 جدول احصائيات دليل الخدمات الأكثر مبيعاً</span>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs font-cairo">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="p-3">اسم الخدمة بالدليل</th>
                      <th className="p-3">عدد مرات التقديم</th>
                      <th className="p-3">إجمالي إيراد المبيعات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border-light dark:divide-brand-border-dark">
                    {servicesReportData.map((row) => (
                      <tr key={row.الخدمة} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-3 font-bold">{row.الخدمة}</td>
                        <td className="p-3 font-mono">{row.المرات} مرة</td>
                        <td className="p-3 font-mono font-bold text-indigo-600 dark:text-brand-accent-dark">{formatCurrency(row.الإيراد)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TECHNICIAN REPORT ================= */}
        {activeReport === 'techs' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-brand-border-light dark:border-brand-border-dark pb-3">
                <span className="text-xs font-bold font-cairo text-slate-700 dark:text-slate-200">👤 مقارنة إنتاجية الزيارات لكل فني صيانة بالورشة</span>
                <button 
                  onClick={() => handleExportCSV('technicians', techReportData)}
                  className="text-xs font-bold font-cairo text-indigo-600 dark:text-brand-accent-dark flex items-center gap-1 hover:underline"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير لملف Excel</span>
                </button>
              </div>

              {techReportData.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 font-cairo">لا توجد زيارات صيانة مسجلة للفنيين بالفترة.</div>
              ) : (
                <div className="h-72 font-sans text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={techReportData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="الفني" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="الزيارات" fill="#8b5cf6" name="عدد الزيارات المنجزة" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-cairo">📋 جدول نشاط الفنيين التفصيلي</span>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs font-cairo">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="p-3">اسم الفني بالورشة</th>
                      <th className="p-3">الزيارات المستلمة</th>
                      <th className="p-3">إجمالي إيراد أعماله</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border-light dark:divide-brand-border-dark">
                    {techReportData.map((row) => (
                      <tr key={row.الفني} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-3 font-bold">{row.الفني}</td>
                        <td className="p-3 font-mono">{row.الزيارات} زيارة</td>
                        <td className="p-3 font-mono font-bold text-indigo-600 dark:text-brand-accent-dark">{formatCurrency(row.القيمة)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= DEBTS REPORT ================= */}
        {activeReport === 'debts' && (
          <div className="space-y-6">
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center justify-between font-cairo text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span>إجمالي الديون المعلقة غير المحصلة بالفواتير المؤجلة:</span>
                <strong className="text-sm font-bold font-mono">{formatCurrency(totalOutstandingDebts)}</strong>
              </div>
              <button 
                onClick={() => handleExportCSV('debts', debtsReportData)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير تقرير الديون</span>
              </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-cairo">📋 قائمة العملاء والذمم الدائنة النشطة</span>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs font-cairo">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="p-3">الزبون</th>
                      <th className="p-3">رقم الهاتف</th>
                      <th className="p-3">رقم الفاتورة</th>
                      <th className="p-3">المبلغ الكلي</th>
                      <th className="p-3">المسدد</th>
                      <th className="p-3 text-red-600">المتبقي دين</th>
                      <th className="p-3">تاريخ استحقاق الدفع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border-light dark:divide-brand-border-dark">
                    {debtsReportData.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 text-red-900 dark:text-red-300">
                        <td className="p-3 font-bold">{row.الزبون}</td>
                        <td className="p-3 font-mono">{row.الهاتف}</td>
                        <td className="p-3 font-mono font-bold">{row.الفاتورة}</td>
                        <td className="p-3 font-mono">{formatCurrency(row.المبلغ)}</td>
                        <td className="p-3 font-mono">{formatCurrency(row.المدفوع)}</td>
                        <td className="p-3 font-mono font-bold text-red-600 dark:text-red-400">{formatCurrency(row.المتبقي)}</td>
                        <td className="p-3 font-mono">{row.الاستحقاق}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= CARS REPORT ================= */}
        {activeReport === 'cars' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-brand-border-light dark:border-brand-border-dark pb-3">
                <span className="text-xs font-bold font-cairo text-slate-700 dark:text-slate-200">🚗 توزيع وهياكل السيارات المخدمة بالمركز</span>
                <button 
                  onClick={() => handleExportCSV('cars_categories', carsReportData)}
                  className="text-xs font-bold font-cairo text-indigo-600 dark:text-brand-accent-dark flex items-center gap-1 hover:underline"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير لملف Excel</span>
                </button>
              </div>

              {carsReportData.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 font-cairo">لا تتوفر سيارات مسجلة بالنظام.</div>
              ) : (
                <div className="h-72 font-sans text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={carsReportData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => `${props.name || ''} (${((props.percent || 0) * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="العدد"
                      >
                        {carsReportData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-cairo">📋 جدول تصنيف فئات السيارات</span>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs font-cairo">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="p-3">نوع هيكل السيارة</th>
                      <th className="p-3">عدد السيارات المسجلة بالمركز</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border-light dark:divide-brand-border-dark font-mono text-xs font-bold">
                    {carsReportData.map((row) => (
                      <tr key={row.النوع} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-3 font-cairo">{row.النوع}</td>
                        <td className="p-3 text-indigo-600 dark:text-brand-accent-dark">{row.العدد} سيارة</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Reports;
