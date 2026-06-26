import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Car as CarIcon, 
  Calendar, 
  ClipboardList, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  History,
  Tag,
  Hash,
  Compass,
  FileText,
  Clock,
  ClipboardCheck,
  ClipboardPlus,
  Lock
} from 'lucide-react';
import { useStore, Car, Visit, VisitService, Invoice, Customer } from '../store/store';
import { useInspectionStore, VehicleInspection } from '../store/useInspectionStore';
import { usePrintStore } from '../components/PrintProvider';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import { formatDate, formatCurrency } from './Dashboard';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const CarDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Store actions/states
  const cars = useStore((state) => state.cars);
  const customers = useStore((state) => state.customers);
  const visits = useStore((state) => state.visits);
  const visitServices = useStore((state) => state.visitServices);
  const invoices = useStore((state) => state.invoices);
  const settings = useStore((state) => state.settings);
  
  const updateCar = useStore((state) => state.updateCar);
  const deleteCar = useStore((state) => state.deleteCar);

  const createInspection = useInspectionStore((state) => state.createInspection);
  const currentUser = useAuthStore((state) => state.currentUser);

  const car = cars.find((c: Car) => c.id === id);
  const customer = car ? customers.find((c: Customer) => c.id === car.customerId) : null;

  // Edit Car Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'visits' | 'inspections'>('visits');
  const [name, setName] = useState(car?.name || '');
  const [brand, setBrand] = useState(car?.brand || '');
  const [year, setYear] = useState(car?.year || 2022);
  const [color, setColor] = useState(car?.color || 'أبيض');
  const [colorHex, setColorHex] = useState(car?.colorHex || '#ffffff');
  const [category, setCategory] = useState<Car['category']>(car?.category || 'Sedan');
  const [plateNumber, setPlateNumber] = useState(car?.plateNumber || '');
  const [chassisNumber, setChassisNumber] = useState(car?.chassisNumber || '');
  const [odometer, setOdometer] = useState(car?.odometer || 0);
  const [notes, setNotes] = useState(car?.notes || '');

  // Delete Car Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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

  if (!car) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold font-cairo text-brand-text-light dark:text-brand-text-dark">المركبة غير موجودة</h3>
        <p className="text-sm text-brand-muted-light dark:text-brand-muted-dark font-cairo mt-1">الرابط قد يكون غير صحيح أو تم حذف السيارة من النظام.</p>
        <button onClick={() => navigate('/customers')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold font-cairo">الذهاب لقائمة الزبائن</button>
      </div>
    );
  }

  // Filter visits for this car only
  const carVisits = visits.filter((v: Visit) => v.carId === car.id);

  const handleUpdateCar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim() || !plateNumber.trim() || odometer <= 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      return;
    }

    // Plate uniqueness validation (excluding current car)
    const plateExists = cars.some((c: Car) => c.id !== car.id && c.plateNumber.replace(/\s+/g, '') === plateNumber.replace(/\s+/g, ''));
    if (plateExists) {
      toast.error('رقم اللوحة هذا مسجل لسيارة أخرى بالفعل!');
      return;
    }

    updateCar(car.id, {
      name,
      brand,
      year,
      color,
      colorHex,
      category,
      plateNumber,
      chassisNumber,
      odometer,
      notes
    });

    toast.success('تم تحديث بيانات السيارة بنجاح');
    setIsEditOpen(false);
  };

  const handleDeleteCar = () => {
    deleteCar(car.id);
    toast.success('تم حذف السيارة من النظام بنجاح');
    setIsDeleteOpen(false);
    if (customer) {
      navigate(`/customers/${customer.id}`);
    } else {
      navigate('/customers');
    }
  };

  const handleNewInspection = () => {
    if (!car) return;
    const ins = createInspection({
      carId:         car.id,
      customerId:    customer?.id || '',
      inspectorName: currentUser?.name || '',
      odometer:      car.odometer || 0,
    });
    navigate(`/inspections/${ins.id}`);
  };

  const getVisitServicesList = (visitId: string) => {
    const vs = visitServices.filter((item: VisitService) => item.visitId === visitId);
    if (vs.length === 0) return 'لا توجد خدمات مضافة';
    return vs.map((v: VisitService) => v.serviceName).join('، ');
  };

  const getVisitInvoiceTotal = (visitId: string) => {
    const inv = invoices.find((i: Invoice) => i.visitId === visitId);
    if (inv) return formatCurrency(inv.total, settings.currency);
    return '-';
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-brand-accent-dark flex items-center justify-center">
            <CarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
              {car.brand} {car.name} ({car.plateNumber})
            </h2>
            {customer && (
              <button 
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="text-xs text-indigo-600 dark:text-brand-accent-dark hover:underline font-cairo flex items-center gap-1 mt-0.5"
              >
                المالك: {customer.name}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleNewInspection}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold font-cairo shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5 transition-all"
          >
            <ClipboardPlus className="w-3.5 h-3.5" />
            <span>إضافة فحص فني</span>
          </button>
          <button
            onClick={() => {
              setName(car.name);
              setBrand(car.brand);
              setYear(car.year);
              setColor(car.color);
              setColorHex(car.colorHex || '#ffffff');
              setCategory(car.category);
              setPlateNumber(car.plateNumber);
              setChassisNumber(car.chassisNumber || '');
              setOdometer(car.odometer);
              setNotes(car.notes || '');
              setIsEditOpen(true);
            }}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-xs font-semibold font-cairo hover:bg-slate-50 dark:hover:bg-slate-800 text-brand-text-light dark:text-brand-text-dark flex items-center justify-center gap-1.5 transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>تعديل التفاصيل</span>
          </button>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-950/50 bg-red-50/20 dark:bg-red-950/10 text-xs font-semibold font-cairo hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف السيارة</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Car Specifications & Upcoming Maintenance */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-base font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
              المواصفات الفنية للمركبة
            </h3>
            
            <div className="space-y-4">
              
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-brand-muted-light dark:text-brand-muted-dark shrink-0" />
                <div className="text-right">
                  <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">الموديل والصانع</p>
                  <p className="font-semibold text-brand-text-light dark:text-brand-text-dark font-cairo">{car.brand} - {car.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-brand-muted-light dark:text-brand-muted-dark shrink-0" />
                <div className="text-right">
                  <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">سنة التصنيع</p>
                  <p className="font-semibold text-brand-text-light dark:text-brand-text-dark font-cairo">{car.year}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-brand-muted-light dark:text-brand-muted-dark shrink-0" />
                <div className="text-right">
                  <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">فئة الهيكل</p>
                  <p className="font-semibold text-brand-text-light dark:text-brand-text-dark font-cairo">
                    {car.category === 'Sedan' && 'صالون (Sedan)'}
                    {car.category === 'SUV' && 'دفع رباعي (SUV)'}
                    {car.category === 'Pickup' && 'بيك آب (Pickup)'}
                    {car.category === 'Van' && 'فان (Van)'}
                    {car.category === 'Luxury' && 'فاخرة (Luxury)'}
                    {car.category === 'Other' && 'أخرى'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div 
                  className="w-4.5 h-4.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" 
                  style={{ backgroundColor: car.colorHex || '#ccc' }}
                />
                <div className="text-right">
                  <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">اللون الخارجي</p>
                  <p className="font-semibold text-brand-text-light dark:text-brand-text-dark font-cairo">{car.color}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-brand-muted-light dark:text-brand-muted-dark shrink-0" />
                <div className="text-right">
                  <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">رقم اللوحة المرورية</p>
                  <p className="font-semibold text-brand-text-light dark:text-brand-text-dark font-cairo">{car.plateNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-brand-muted-light dark:text-brand-muted-dark shrink-0" />
                <div className="text-right">
                  <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">رقم الهيكل (VIN)</p>
                  <p className="font-semibold text-brand-text-light dark:text-brand-text-dark font-cairo direction-ltr inline-block">
                    {car.chassisNumber || 'غير متوفر'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-brand-muted-light dark:text-brand-muted-dark shrink-0" />
                <div className="text-right">
                  <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">قراءة العداد الحالية</p>
                  <p className="font-semibold text-brand-text-light dark:text-brand-text-dark font-cairo">{car.odometer.toLocaleString('ar-IQ')} كم</p>
                </div>
              </div>

              {car.notes && (
                <div className="flex items-start gap-3 border-t border-brand-border-light dark:border-brand-border-dark pt-4">
                  <FileText className="w-4 h-4 text-brand-muted-light dark:text-brand-muted-dark shrink-0 mt-0.5" />
                  <div className="text-right">
                    <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo">ملاحظات الفحص</p>
                    <p className="text-xs text-brand-text-light dark:text-brand-text-dark leading-relaxed font-cairo">{car.notes}</p>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Upcoming Maintenance Card */}
          <div className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-base font-bold text-brand-text-light dark:text-brand-text-dark font-cairo flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-indigo-500" />
              <span>مواعيد الصيانة القادمة</span>
            </h3>

            <div className="space-y-3">
              {(() => {
                const oilServicesForCar = visitServices.filter((vs: VisitService) => 
                  carVisits.map((v: Visit) => v.id).includes(vs.visitId) && 
                  vs.oilDetails && 
                  (vs.oilDetails.nextChangeOdometer || vs.oilDetails.nextChangeDate)
                );

                const latestMaintenanceBySubtype: Record<string, typeof oilServicesForCar[0]> = {};
                oilServicesForCar.forEach((vs: VisitService) => {
                  const service = useStore.getState().services.find((s: { id: string; oilSubtype?: string | null }) => s.id === vs.serviceId);
                  const subtype = service?.oilSubtype || 'engine';
                  
                  const existing = latestMaintenanceBySubtype[subtype];
                  if (!existing) {
                    latestMaintenanceBySubtype[subtype] = vs;
                  } else {
                    const existingOdo = existing.oilDetails?.nextChangeOdometer || 0;
                    const currentOdo = vs.oilDetails?.nextChangeOdometer || 0;
                    if (currentOdo > existingOdo) {
                      latestMaintenanceBySubtype[subtype] = vs;
                    }
                  }
                });

                const scheduledItems = Object.entries(latestMaintenanceBySubtype);

                if (scheduledItems.length === 0) {
                  return (
                    <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo text-center py-2">
                      لا يوجد صيانة قادمة مجدولة لهذه السيارة بعد.
                    </p>
                  );
                }

                const getSubtypeLabel = (sub: string) => {
                  if (sub === 'engine') return 'زيت المحرك (Engine)';
                  if (sub === 'brake') return 'زيت الفرامل (Brake Fluid)';
                  if (sub === 'differential') return 'زيت الدفرنس (Differential)';
                  if (sub === 'steering') return 'زيت التوجيه (Power Steering)';
                  if (sub === 'transmission') return 'زيت القير (Transmission)';
                  if (sub === 'coolant') return 'سائل التبريد (Coolant)';
                  return 'صيانة زيت';
                };

                return scheduledItems.map(([subtype, vs]) => {
                  const nextOdo = vs.oilDetails?.nextChangeOdometer || 0;
                  const nextDate = vs.oilDetails?.nextChangeDate;
                  const diffOdo = nextOdo - car.odometer;
                  
                  let statusColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30';
                  let statusText = 'بحالة جيدة';

                  if (nextOdo > 0) {
                    if (diffOdo <= 0) {
                      statusColor = 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30';
                      statusText = 'متجاوز الاستحقاق!';
                    } else if (diffOdo <= 500) {
                      statusColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30';
                      statusText = 'مستحق قريباً';
                    }
                  }

                  return (
                    <div 
                      key={subtype} 
                      className="p-3 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark/40 flex flex-col gap-2 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
                          {getSubtypeLabel(subtype)}
                        </span>
                        {nextOdo > 0 && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${statusColor}`}>
                            {statusText}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-brand-muted-light dark:text-brand-muted-dark">
                        {nextOdo > 0 && (
                          <div>
                            <span>العداد القادم: </span>
                            <span className="font-bold text-brand-text-light dark:text-brand-text-dark">
                              {nextOdo.toLocaleString('ar-IQ')} كم
                            </span>
                          </div>
                        )}
                        {nextDate && (
                          <div>
                            <span>التاريخ القادم: </span>
                            <span className="font-bold text-brand-text-light dark:text-brand-text-dark">
                              {new Date(nextDate).toLocaleDateString('ar-IQ')}
                            </span>
                          </div>
                        )}
                      </div>
                      {nextOdo > 0 && (
                        <div className="text-[10px] border-t border-brand-border-light dark:border-brand-border-dark pt-1.5 mt-0.5 font-cairo">
                          {diffOdo <= 0 ? (
                            <span className="text-red-500 font-bold">
                              متجاوز بمسافة: {Math.abs(diffOdo).toLocaleString('ar-IQ')} كم
                            </span>
                          ) : (
                            <span>
                              متبقي: <span className="font-bold">{diffOdo.toLocaleString('ar-IQ')} كم</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

        </div>

        {/* Right Column: Visits & Inspections Tabbed Interface */}
        <div className="lg:col-span-2 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-6 rounded-2xl shadow-sm flex flex-col font-cairo">
          {/* Tabs Selector Header */}
          <div className="flex border-b border-brand-border-light dark:border-brand-border-dark pb-3 mb-6 items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('visits')}
                className={`flex items-center gap-2 pb-3 -mb-[13px] border-b-2 font-cairo text-xs sm:text-sm font-bold transition-colors ${
                  activeTab === 'visits'
                    ? 'border-indigo-600 text-indigo-600 dark:border-brand-accent-dark dark:text-brand-accent-dark'
                    : 'border-transparent text-brand-muted-light dark:text-brand-muted-dark hover:text-brand-text-light dark:hover:text-brand-text-dark'
                }`}
              >
                <History className="w-4 h-4" />
                <span>سجل زيارات الصيانة للمركبة ({carVisits.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('inspections')}
                className={`flex items-center gap-2 pb-3 -mb-[13px] border-b-2 font-cairo text-xs sm:text-sm font-bold transition-colors ${
                  activeTab === 'inspections'
                    ? 'border-indigo-600 text-indigo-600 dark:border-brand-accent-dark dark:text-brand-accent-dark'
                    : 'border-transparent text-brand-muted-light dark:text-brand-muted-dark hover:text-brand-text-light dark:hover:text-brand-text-dark'
                }`}
              >
                <ClipboardCheck className="w-4.5 h-4.5" />
                <span>سجل الفحوصات الفنية</span>
              </button>
            </div>
          </div>

          {activeTab === 'visits' ? (
            <div>
              {carVisits.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border-light dark:border-brand-border-dark text-xs text-brand-muted-light dark:text-brand-muted-dark font-semibold font-cairo">
                        <th className="p-4">التاريخ</th>
                        <th className="p-4">قراءة العداد (كم)</th>
                        <th className="p-4">الخدمات المقدمة</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">المجموع الكلي</th>
                        <th className="p-4 text-left">التحكم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border-light dark:divide-brand-border-dark/60 text-sm">
                      {[...carVisits]
                        .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
                        .map((visit) => (
                          <tr key={visit.id} className="hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark/50 transition-colors">
                            <td className="p-4 text-xs font-semibold text-brand-text-light dark:text-brand-text-dark">
                              {formatDate(visit.entryDate)}
                            </td>
                            <td className="p-4 font-semibold text-brand-text-light dark:text-brand-text-dark font-cairo">
                              {visit.entryOdometer.toLocaleString('ar-IQ')} كم
                            </td>
                            <td className="p-4 text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo max-w-[200px] truncate">
                              {getVisitServicesList(visit.id)}
                            </td>
                            <td className="p-4">
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
                            <td className="p-4 font-bold text-brand-text-light dark:text-brand-text-dark font-cairo">
                              {getVisitInvoiceTotal(visit.id)}
                            </td>
                            <td className="p-4 text-left">
                              <button
                                onClick={() => navigate(`/visits/${visit.id}`)}
                                className="px-2.5 py-1.5 rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-xs font-semibold font-cairo text-brand-text-light dark:text-brand-text-dark hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-brand-accent-dark transition-colors"
                              >
                                عرض التفاصيل
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="لا توجد زيارات صيانة للمركبة"
                  description="لم تسجل أي زيارة صيانة لهذه السيارة حتى الآن."
                  icon={<ClipboardList className="w-8 h-8" />}
                />
              )}
            </div>
          ) : (
            <CarInspectionsTab car={car} customer={customer} />
          )}
        </div>

      </div>

      {/* Modal: Edit Car */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="تعديل بيانات السيارة"
      >
        <form onSubmit={handleUpdateCar} className="space-y-4 text-right">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
                ماركة السيارة / الصانع <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-cairo text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
                موديل السيارة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-cairo text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
                فئة السيارة <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Car['category'])}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-cairo text-sm"
              >
                <option value="Sedan">صالون (Sedan)</option>
                <option value="SUV">دفع رباعي (SUV)</option>
                <option value="Pickup">بيك آب (Pickup)</option>
                <option value="Van">فان (Van)</option>
                <option value="Luxury">فاخرة (Luxury)</option>
                <option value="Other">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
                سنة الصنع <span className="text-red-500">*</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-cairo text-sm"
              >
                {Array.from({ length: 36 }, (_, i) => 2026 - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
                رقم اللوحة المرورية <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-cairo text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
                قراءة العداد (كم) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={odometer || ''}
                onChange={(e) => setOdometer(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-cairo text-sm"
              />
            </div>
          </div>

          {/* Color swatches */}
          <div>
            <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
              اللون الخارجي للسيارة <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4 items-center">
              <input
                type="text"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-cairo text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent cursor-pointer shrink-0"
                />
                <span className="text-xs text-brand-muted-light dark:text-brand-muted-dark font-cairo mt-2.5 leading-none">تخصيص اللون</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 justify-start">
              {colorSwatches.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => {
                    setColor(item.name);
                    setColorHex(item.hex);
                  }}
                  className="p-1 rounded-lg border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark flex items-center gap-1 text-[10px] font-semibold font-cairo hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" style={{ backgroundColor: item.hex }} />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
              رقم الهيكل (VIN)
            </label>
            <input
              type="text"
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left direction-ltr text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-light dark:text-brand-text-dark mb-2 font-cairo">
              ملاحظات
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-cairo text-sm resize-none"
            />
          </div>

          <div className="pt-4 border-t border-brand-border-light dark:border-brand-border-dark flex items-center justify-between gap-3">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold font-cairo transition-all text-sm text-center shadow-lg shadow-indigo-600/10"
            >
              تحديث البيانات
            </button>
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-brand-border-light dark:border-brand-border-dark text-brand-text-light dark:text-brand-text-dark hover:bg-brand-surface-light dark:hover:bg-brand-bg-dark font-medium font-cairo transition-all text-sm text-center"
            >
              إلغاء
            </button>
          </div>

        </form>
      </Modal>

      {/* Modal: Confirm Delete */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="تأكيد حذف السيارة"
        size="sm"
      >
        <div className="space-y-4 text-right">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-8 h-8 shrink-0" />
            <div>
              <h4 className="font-bold font-cairo text-sm">هل أنت متأكد من الحذف؟</h4>
              <p className="text-xs font-cairo text-brand-muted-light dark:text-brand-muted-dark mt-0.5">
                سيؤدي هذا الإجراء إلى حذف السيارة ({car.brand} {car.name}) من النظام نهائياً ولا يمكن استرجاعها.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-brand-border-light dark:border-brand-border-dark flex items-center justify-between gap-3">
            <button
              onClick={handleDeleteCar}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold font-cairo transition-all active:scale-[0.98] text-sm text-center shadow-lg shadow-red-600/10"
            >
              نعم، احذف السيارة
            </button>
            <button
              onClick={() => setIsDeleteOpen(false)}
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

// ─── INSPECTION SUB-TAB COMPONENTS ───

interface CarInspectionsTabProps {
  car: Car;
  customer: Customer | null;
}

function CarInspectionsTab({ car, customer }: CarInspectionsTabProps) {
  const inspections = useInspectionStore(s =>
    (s.inspections || []).filter(i => i.carId === car.id)
  );
  const createInspection = useInspectionStore(s => s.createInspection);
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.currentUser);

  const sorted = [...(inspections || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  function handleNewInspection() {
    const ins = createInspection({
      carId:         car.id,
      customerId:    customer?.id || '',
      inspectorName: currentUser?.name || '',
      odometer:      car.odometer || 0,
    });
    navigate(`/inspections/${ins.id}`);
  }

  return (
    <div style={{ direction: 'rtl' }} className="font-cairo mt-2">
      {/* Header */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   '20px',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }} className="text-brand-text-light dark:text-brand-text-dark">
            سجل الفحوصات الفنية للمركبة
          </h3>
          <p style={{
            margin: '4px 0 0',
            fontSize: '12px',
          }} className="text-brand-muted-light dark:text-brand-muted-dark">
            {sorted.length} فحص مسجل
          </p>
        </div>
        <button
          onClick={handleNewInspection}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 text-xs font-semibold font-cairo shadow-lg shadow-indigo-600/15 transition-all"
        >
          <ClipboardPlus size={14} />
          فحص جديد
        </button>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div style={{
          textAlign:    'center',
          padding:      '40px 20px',
          border:       '2px dashed var(--color-border-tertiary)',
          borderRadius: '14px',
        }} className="bg-brand-surface-light dark:bg-brand-surface-dark/40 text-brand-muted-light dark:text-brand-muted-dark">
          <ClipboardCheck size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} className="text-indigo-500" />
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }} className="text-brand-text-light dark:text-brand-text-dark">
            لا توجد فحوصات مسجلة
          </p>
          <p style={{ fontSize: '12px', marginBottom: '16px' }}>
            ابدأ بفحص شامل لتشخيص الأنظمة الفنية لهذه السيارة.
          </p>
          <button
            onClick={handleNewInspection}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 text-xs font-semibold font-cairo shadow-lg shadow-indigo-600/15 transition-all"
          >
            بدء فحص جديد
          </button>
        </div>
      )}

      {/* Inspections list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sorted.map(ins => (
          <InspectionListCard
            key={ins.id}
            inspection={ins}
            car={car}
            customer={customer}
            onOpen={() => navigate(`/inspections/${ins.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

interface InspectionListCardProps {
  inspection: VehicleInspection;
  car: Car;
  customer: Customer | null;
  onOpen: () => void;
}

function InspectionListCard({ inspection, car, customer, onOpen }: InspectionListCardProps) {
  const triggerPrint = usePrintStore(s => s.triggerPrint);

  const statusConfig = {
    good:      { label: 'سليمة',       color: '#16A34A', bg: '#DCFCE7', icon: '✅' },
    attention: { label: 'تحتاج متابعة', color: '#D97706', bg: '#FEF3C7', icon: '⚠️' },
    poor:      { label: 'تحتاج إصلاح', color: '#DC2626', bg: '#FEE2E2', icon: '🔴' },
  };
  const st = statusConfig[inspection.overallStatus] || statusConfig.good;

  const allItems = (inspection.sections || []).flatMap(s => s?.items || []).filter(i => i && i.status !== 'na');

  const good      = allItems.filter(i=>i.status==='good').length;
  const attention = allItems.filter(i=>i.status==='attention').length;
  const replace   = allItems.filter(i=>i.status==='replace').length;
  const total     = allItems.length;

  return (
    <div
      style={{
        background:   'var(--color-background-primary)',
        border:       '1px solid var(--color-border-tertiary)',
        borderRadius: '12px',
        overflow:     'hidden',
        cursor:       'pointer',
        transition:   'all 0.15s',
      }}
      className="hover:shadow-md dark:hover:shadow-indigo-950/20"
      onClick={onOpen}
    >
      {/* Color top border */}
      <div style={{ height: '3px', background: st.color }} />

      <div style={{ padding: '14px 16px' }}>
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-start',
          gap:            '12px',
        }}>
          {/* Left: info */}
          <div style={{ flex: 1 }}>
            <div style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '10px',
              marginBottom: '6px',
              flexWrap:   'wrap',
            }}>
              <span style={{
                background:   st.bg,
                color:        st.color,
                padding:      '2px 8px',
                borderRadius: '99px',
                fontSize:     '11px',
                fontWeight:   '700',
              }}>
                {st.icon} {st.label}
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-brand-accent-dark">
                {inspection.reportNumber}
              </span>
              {inspection.isLocked && (
                <span style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        '3px',
                  fontSize:   '11px',
                }} className="text-brand-muted-light dark:text-brand-muted-dark">
                  <Lock size={11} />
                  مقفل
                </span>
              )}
            </div>

            <div style={{
              fontSize:     '12px',
              marginBottom: '10px',
            }} className="text-brand-muted-light dark:text-brand-muted-dark">
              {new Date(inspection.date).toLocaleDateString('ar-IQ')}
              {inspection.inspectorName && ` • الفاحص: ${inspection.inspectorName}`}
              {inspection.odometer > 0 && ` • ${inspection.odometer.toLocaleString('ar-IQ')} كم`}
            </div>

            {/* Progress bars */}
            {total > 0 && (
              <div>
                <div style={{
                  display:       'flex',
                  height:        '6px',
                  borderRadius:  '99px',
                  overflow:      'hidden',
                  gap:           '2px',
                  marginBottom:  '6px',
                }} className="bg-slate-100 dark:bg-slate-800">
                  <div style={{
                    flex:       good,
                    background: '#16A34A',
                    minWidth:   good > 0 ? '4px' : 0,
                  }} />
                  <div style={{
                    flex:       attention,
                    background: '#F59E0B',
                    minWidth:   attention > 0 ? '4px' : 0,
                  }} />
                  <div style={{
                    flex:       replace,
                    background: '#DC2626',
                    minWidth:   replace > 0 ? '4px' : 0,
                  }} />
                </div>
                <div style={{
                  display:  'flex',
                  gap:      '12px',
                  fontSize: '11px',
                }}>
                  <span style={{ color: '#16A34A', fontWeight: '600' }}>
                    ✓ {good} سليم
                  </span>
                  <span style={{ color: '#F59E0B', fontWeight: '600' }}>
                    ⚠ {attention} متابعة
                  </span>
                  <span style={{ color: '#DC2626', fontWeight: '600' }}>
                    ✕ {replace} استبدال
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div 
            style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           '6px',
              flexShrink:    0,
            }}
            onClick={(e) => e.stopPropagation()} // Prevent card click
          >
            <button
              onClick={onOpen}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-1 px-3 text-xs font-semibold font-cairo transition-colors text-center"
            >
              عرض
            </button>
            <button
              onClick={() => triggerPrint({
                type: 'inspection',
                inspection,
                car,
                customer,
              })}
              style={{
                background:   'var(--color-background-secondary)',
                border:       '1px solid var(--color-border-tertiary)',
                borderRadius: '8px',
                padding:      '4px 10px',
                fontSize:     '11px',
                cursor:       'pointer',
              }}
              className="text-brand-text-light dark:text-brand-text-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
            >
              🖨️ طباعة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarDetails;
