import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { Car, Customer } from '../store/customerStore';
import { useInspectionStore, InspectionItemStatus, InspectionAttachment } from '../store/useInspectionStore';
import { usePrintStore } from '../components/PrintProvider';
import { toast } from '../store/toastStore';
import {
  Cog,
  Settings2,
  CircleDot,
  Car as CarIcon,
  Circle,
  Zap,
  Shield,
  Wind,
  Printer,
  Lock,
  ArrowRight,
  ClipboardCheck,
  AlertTriangle,
  Paperclip,
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  Download,
  X,
  Eye,
  BatteryCharging,
  Cpu,
  Wrench,
  Gauge,
  Activity,
  CheckCircle,
  Flame,
  Thermometer,
  Radio,
  Monitor,
  Key,
  Camera,
  Package,
  Layers,
  BarChart,
  Scan,
} from 'lucide-react';

// ─── Dynamic Icon Map ─────────────────────────────────────────
const IconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Cog, Settings2, CircleDot, Car: CarIcon, Circle, Zap, Shield, Wind,
  BatteryCharging, Cpu, Wrench, Gauge, Activity, CheckCircle, Flame,
  Thermometer, Radio, Monitor, Key, Camera, Package, Layers, BarChart, Scan,
  Printer, Lock, ArrowRight, ClipboardCheck, AlertTriangle,
  Tool: Wrench,
  Droplets: Zap,
  Flashlight: Zap,
};

function DynamicIcon({ name, size, color }: { name: string; size?: number; color?: string }) {
  const IconComponent = IconMap[name];
  if (!IconComponent) return <ClipboardCheck size={size} color={color} />;
  return <IconComponent size={size} color={color} />;
}

// ─── Status Buttons ───────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'good',      label: 'سليم',      color: '#16A34A', bg: '#DCFCE7', short: '✓' },
  { value: 'attention', label: 'متابعة',    color: '#D97706', bg: '#FEF3C7', short: '⚠' },
  { value: 'replace',   label: 'استبدال',   color: '#DC2626', bg: '#FEE2E2', short: '✕' },
  { value: 'na',        label: 'لا ينطبق',  color: '#94A3B8', bg: '#F1F5F9', short: '-' },
] as const;

interface StatusButtonsProps {
  currentStatus: InspectionItemStatus;
  onChange: (status: InspectionItemStatus) => void;
  disabled: boolean;
}

function StatusButtons({ currentStatus, onChange, disabled }: StatusButtonsProps) {
  return (
    <div style={{ display: 'flex', gap: '5px' }}>
      {STATUS_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          title={opt.label}
          style={{
            width:        '36px',
            height:       '32px',
            borderRadius: '7px',
            border:       currentStatus === opt.value
              ? `2px solid ${opt.color}`
              : '1px solid var(--color-border-tertiary)',
            background:   currentStatus === opt.value ? opt.bg : 'var(--color-background-secondary)',
            color:        currentStatus === opt.value ? opt.color : 'var(--color-text-secondary)',
            fontWeight:   '700',
            fontSize:     '13px',
            cursor:       disabled ? 'not-allowed' : 'pointer',
            transition:   'all 0.1s',
            opacity:      disabled ? 0.5 : 1,
          }}
        >
          {opt.short}
        </button>
      ))}
    </div>
  );
}

// ─── Attachment Viewer Modal ──────────────────────────────────
function AttachmentModal({ att, onClose }: { att: InspectionAttachment; onClose: () => void }) {
  const isImage = att.fileType.startsWith('image/');
  const isPDF   = att.fileType === 'application/pdf';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: '14px', overflow: 'hidden',
          maxWidth: '90vw', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontWeight: '700', fontSize: '13px', fontFamily: 'Cairo, sans-serif' }}>
            {att.name}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={att.fileData}
              download={att.name}
              style={{
                padding: '6px 14px', borderRadius: '8px',
                background: '#6366F1', color: '#fff', textDecoration: 'none',
                fontSize: '12px', fontWeight: '600', fontFamily: 'Cairo, sans-serif',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <Download size={14} />
              تحميل
            </a>
            <button
              onClick={onClose}
              style={{
                padding: '6px', borderRadius: '8px', border: '1px solid #E2E8F0',
                background: '#F8FAFC', cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ overflow: 'auto', padding: '12px', maxHeight: '75vh' }}>
          {isImage && (
            <img
              src={att.fileData}
              alt={att.name}
              style={{ maxWidth: '100%', borderRadius: '8px' }}
            />
          )}
          {isPDF && (
            <iframe
              src={att.fileData}
              style={{ width: '70vw', height: '70vh', border: 'none', borderRadius: '8px' }}
              title={att.name}
            />
          )}
          {!isImage && !isPDF && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontFamily: 'Cairo, sans-serif' }}>
              <FileText size={40} style={{ marginBottom: '12px' }} />
              <p>لا يمكن معاينة هذا النوع من الملفات مباشرةً.</p>
              <a
                href={att.fileData}
                download={att.name}
                style={{
                  display: 'inline-block', marginTop: '12px',
                  padding: '8px 16px', borderRadius: '8px',
                  background: '#6366F1', color: '#fff',
                  textDecoration: 'none', fontWeight: '600',
                }}
              >
                تحميل الملف
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function InspectionDetailPage() {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const navigate = useNavigate();

  const inspection        = useInspectionStore(s => s.inspections.find(i => i.id === inspectionId));
  const updateItemStatus  = useInspectionStore(s => s.updateItemStatus);
  const updateInspection  = useInspectionStore(s => s.updateInspection);
  const lockInspection    = useInspectionStore(s => s.lockInspection);
  const addAttachment     = useInspectionStore(s => s.addAttachment);
  const deleteAttachment  = useInspectionStore(s => s.deleteAttachment);
  const triggerPrint      = usePrintStore(s => s.triggerPrint);
  const cars              = useStore(state => state.cars);
  const customers         = useStore(state => state.customers);

  const [activeSectionId, setActiveSectionId] = useState(inspection?.sections[0]?.id || '');
  const [viewingAtt, setViewingAtt]           = useState<InspectionAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!inspection) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl font-cairo">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-brand-text-light dark:text-brand-text-dark">الفحص غير موجود</h3>
        <p className="text-sm text-brand-muted-light dark:text-brand-muted-dark mt-1">الرابط غير صحيح أو تم حذف هذا الفحص.</p>
        <button onClick={() => navigate('/customers')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">قائمة العملاء</button>
      </div>
    );
  }

  const car       = cars.find((c: Car) => c.id === inspection.carId);
  const customer  = car ? customers.find((c: Customer) => c.id === car.customerId) : null;
  const isLocked  = inspection.isLocked;
  const activeSection = (inspection.sections || []).find(s => s.id === activeSectionId);

  const allItems = (inspection.sections || []).flatMap(s => s?.items || []);
  const checked  = allItems.filter(i => i.status !== 'na').length;
  const total    = allItems.length;
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

  const attachments = inspection.attachments || [];

  const handlePrint = () => {
    if (!car || !customer) {
      toast.error('لا يمكن الطباعة لعدم توفر بيانات السيارة أو العميل');
      return;
    }
    triggerPrint({ type: 'inspection', inspection, car, customer });
  };

  const handleLock = () => {
    if (confirm('هل تريد قفل هذا الفحص؟ لن تتمكن من التعديل عليه بعد ذلك.')) {
      lockInspection(inspection.id);
      toast.success('تم قفل الفحص بنجاح ولم يعد قابلاً للتعديل');
    }
  };

  // ─── File Upload ─────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`الملف "${file.name}" أكبر من 10 ميجابايت — يرجى اختيار ملف أصغر`);
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        const data = ev.target?.result as string;
        addAttachment(inspection.id, file.name, data, file.type);
        toast.success(`تم رفع الملف: ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
    // reset input
    e.target.value = '';
  };

  // ─── JSX ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-112px)] font-cairo" style={{ direction: 'rtl' }}>

      {/* ── VIEWER MODAL ── */}
      {viewingAtt && (
        <AttachmentModal att={viewingAtt} onClose={() => setViewingAtt(null)} />
      )}

      {/* ── HEADER BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-brand-surface-dark border-b border-brand-border-light dark:border-brand-border-dark px-6 py-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => car ? navigate(`/cars/${car.id}`) : navigate('/customers')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-brand-text-light dark:text-brand-text-dark transition-colors"
            title="العودة للمركبة"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-brand-text-light dark:text-brand-text-dark">
                تقرير فحص المركبة: {inspection.reportNumber}
              </h2>
              {isLocked && (
                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-brand-muted-light dark:text-brand-muted-dark text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-border-light dark:border-brand-border-dark">
                  <Lock size={10} />
                  مقفل ومحمي
                </span>
              )}
            </div>
            {car && (
              <p className="text-xs text-brand-muted-light dark:text-brand-muted-dark mt-0.5">
                المركبة: <span className="font-semibold text-brand-text-light dark:text-brand-text-dark">{car.brand} {car.name} ({car.plateNumber})</span>
                {customer && ` • المالك: ${customer.name}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-brand-muted-light dark:text-brand-muted-dark">
            {attachments.length > 0 && `${attachments.length} مرفق`}
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 text-xs font-semibold shadow-lg shadow-indigo-600/10 transition-all"
          >
            <Printer size={15} />
            طباعة التقرير
          </button>
        </div>
      </div>

      {/* ── 3 COLUMNS ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Section Navigator ── */}
        <div className="w-[210px] shrink-0 bg-white dark:bg-brand-surface-dark border-l border-brand-border-light dark:border-brand-border-dark overflow-y-auto p-3 space-y-1.5">
          <div className="text-[10px] font-bold text-brand-muted-light dark:text-brand-muted-dark uppercase tracking-wider px-2 mb-3">
            أنظمة المركبة
          </div>

          {(inspection.sections || []).map(sec => {
            const secChecked = (sec.items || []).filter(i => i.status !== 'na').length;
            const hasIssue   = (sec.items || []).some(i => i.status === 'replace' || i.status === 'attention');
            const isActive   = sec.id === activeSectionId;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className="w-full text-right rounded-xl p-2.5 border-0 transition-all cursor-pointer relative flex flex-col gap-0.5"
                style={{
                  background:  isActive ? `${sec.color}12` : 'transparent',
                  borderRight: isActive ? `3.5px solid ${sec.color}` : '3.5px solid transparent',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold"
                    style={{ color: isActive ? sec.color : 'var(--color-text-primary)' }}
                  >
                    {sec.name}
                  </span>
                  {hasIssue && (
                    <span
                      className="w-2 h-2 rounded-full animate-pulse shrink-0"
                      style={{ background: (sec.items || []).some(i => i.status === 'replace') ? '#DC2626' : '#F59E0B' }}
                    />
                  )}
                </div>
                <div className="text-[10px] text-brand-muted-light dark:text-brand-muted-dark">
                  {secChecked}/{(sec.items || []).length} بند
                </div>
              </button>
            );
          })}

          {/* Attachments nav shortcut */}
          <div className="border-t border-brand-border-light dark:border-brand-border-dark pt-2 mt-2">
            <button
              onClick={() => setActiveSectionId('__attachments__')}
              className="w-full text-right rounded-xl p-2.5 border-0 transition-all cursor-pointer flex items-center gap-2"
              style={{
                background:  activeSectionId === '__attachments__' ? '#6366F115' : 'transparent',
                borderRight: activeSectionId === '__attachments__' ? '3.5px solid #6366F1' : '3.5px solid transparent',
              }}
            >
              <Paperclip
                size={14}
                color={activeSectionId === '__attachments__' ? '#6366F1' : 'var(--color-text-secondary)'}
              />
              <span
                className="text-xs font-bold"
                style={{ color: activeSectionId === '__attachments__' ? '#6366F1' : 'var(--color-text-secondary)' }}
              >
                المرفقات ({attachments.length})
              </span>
            </button>
          </div>
        </div>

        {/* ── CENTER: Items / Attachments ── */}
        <div className="flex-1 overflow-y-auto p-6 bg-brand-bg-light dark:bg-brand-bg-dark/20 space-y-5">

          {/* ─── ATTACHMENTS PANEL ─── */}
          {activeSectionId === '__attachments__' ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30">
                    <Paperclip size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-text-light dark:text-brand-text-dark">
                      المستندات والملفات المرفقة
                    </h3>
                    <p className="text-[11px] text-brand-muted-light dark:text-brand-muted-dark mt-0.5">
                      قياسات البطارية، نتائج جهاز التشخيص، صور، تقارير PDF...
                    </p>
                  </div>
                </div>

                {!isLocked && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf,.xlsx,.xls,.doc,.docx"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 text-xs font-semibold transition-all"
                    >
                      <Upload size={14} />
                      رفع ملف / صورة
                    </button>
                  </>
                )}
              </div>

              {/* Attachment List */}
              {attachments.length === 0 ? (
                <div
                  className="text-center py-14 border-2 border-dashed rounded-2xl border-brand-border-light dark:border-brand-border-dark text-brand-muted-light dark:text-brand-muted-dark"
                  style={{ cursor: isLocked ? 'default' : 'pointer' }}
                  onClick={() => !isLocked && fileInputRef.current?.click()}
                >
                  <Paperclip size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p className="text-sm font-semibold">لا توجد ملفات مرفقة بعد</p>
                  {!isLocked && (
                    <p className="text-xs mt-1">اضغط هنا أو على زر "رفع ملف / صورة" لإضافة مرفقات</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {attachments.map(att => {
                    const isImage = att.fileType.startsWith('image/');
                    const isPDF   = att.fileType === 'application/pdf';
                    return (
                      <div
                        key={att.id}
                        className="bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Preview */}
                        <div
                          className="h-28 flex items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-900/30"
                          onClick={() => setViewingAtt(att)}
                        >
                          {isImage ? (
                            <img
                              src={att.fileData}
                              alt={att.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-brand-muted-light dark:text-brand-muted-dark">
                              {isPDF ? <FileText size={36} className="text-red-400" /> : <FileText size={36} />}
                              <span className="text-[10px] font-bold uppercase">
                                {att.fileType.split('/')[1] || 'ملف'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info + Actions */}
                        <div className="p-2.5">
                          <p className="text-xs font-semibold text-brand-text-light dark:text-brand-text-dark truncate" title={att.name}>
                            {att.name}
                          </p>
                          <p className="text-[10px] text-brand-muted-light dark:text-brand-muted-dark mt-0.5">
                            {new Date(att.uploadedAt).toLocaleDateString('ar-IQ')}
                          </p>
                          <div className="flex gap-1.5 mt-2">
                            <button
                              onClick={() => setViewingAtt(att)}
                              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1 rounded-lg border border-brand-border-light dark:border-brand-border-dark hover:bg-slate-50 dark:hover:bg-slate-800 text-brand-muted-light dark:text-brand-muted-dark transition-colors"
                            >
                              <Eye size={11} />
                              عرض
                            </button>
                            <a
                              href={att.fileData}
                              download={att.name}
                              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1 rounded-lg border border-brand-border-light dark:border-brand-border-dark hover:bg-slate-50 dark:hover:bg-slate-800 text-brand-muted-light dark:text-brand-muted-dark transition-colors"
                            >
                              <Download size={11} />
                              تحميل
                            </a>
                            {!isLocked && (
                              <button
                                onClick={() => {
                                  if (confirm(`حذف "${att.name}"؟`)) {
                                    deleteAttachment(inspection.id, att.id);
                                    toast.success('تم حذف المرفق');
                                  }
                                }}
                                className="flex items-center justify-center p-1 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (

            /* ─── CHECKLIST SECTION ─── */
            activeSection ? (
              <>
                {/* Section Header */}
                <div className="flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-brand-surface-dark border border-brand-border-light dark:border-brand-border-dark p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${activeSection.color}15`, border: `1.5px solid ${activeSection.color}30` }}
                    >
                      <DynamicIcon name={activeSection.icon} size={20} color={activeSection.color} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-brand-text-light dark:text-brand-text-dark">{activeSection.name}</h3>
                      <p className="text-[11px] text-brand-muted-light dark:text-brand-muted-dark mt-0.5">عدد البنود: {activeSection.items.length}</p>
                    </div>
                  </div>

                  {!isLocked && (
                    <button
                      onClick={() => {
                        activeSection.items.forEach(item => {
                          updateItemStatus(inspection.id, activeSection.id, item.id, 'good');
                        });
                        toast.success(`تم تعيين كافة بنود قسم "${activeSection.name}" كسليمة`);
                      }}
                      className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl py-1.5 px-3 text-xs font-bold transition-all"
                    >
                      ✓ تحديد الكل سليم
                    </button>
                  )}
                </div>

                {/* Items */}
                <div className="bg-white dark:bg-brand-surface-dark rounded-2xl border border-brand-border-light dark:border-brand-border-dark overflow-hidden shadow-sm">
                  {activeSection.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col gap-2"
                      style={{
                        borderBottom: idx < activeSection.items.length - 1 ? '1px solid var(--color-border-tertiary)' : 'none',
                        background:
                          item.status === 'replace' ? '#FEF2F2' :
                          item.status === 'attention' ? '#FFFBEB' : 'transparent',
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold text-brand-text-light dark:text-brand-text-dark">{item.name}</div>
                          <div className="text-[10px] text-brand-muted-light dark:text-brand-muted-dark mt-0.5 font-mono">{item.nameEn}</div>
                        </div>
                        <StatusButtons
                          currentStatus={item.status}
                          disabled={isLocked}
                          onChange={status => updateItemStatus(inspection.id, activeSection.id, item.id, status)}
                        />
                      </div>

                      {(item.status === 'attention' || item.status === 'replace') && !isLocked && (
                        <input
                          type="text"
                          value={item.notes}
                          onChange={e => updateItemStatus(inspection.id, activeSection.id, item.id, item.status, e.target.value)}
                          placeholder="مثال: يرجى استبدال التيل الأمامي خلال 1000 كم..."
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right text-xs"
                        />
                      )}

                      {item.notes && (isLocked || (item.status !== 'attention' && item.status !== 'replace')) && (
                        <div className="mt-1 text-[11px] text-brand-muted-light dark:text-brand-muted-dark italic bg-slate-50 dark:bg-slate-900/30 p-2 rounded-lg border border-slate-100 dark:border-slate-800/40">
                          الملاحظة: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-brand-muted-light dark:text-brand-muted-dark">
                يرجى اختيار أحد الأنظمة للبدء بالفحص.
              </div>
            )
          )}
        </div>

        {/* ── RIGHT: Summary & Actions ── */}
        <div className="w-[270px] shrink-0 bg-white dark:bg-brand-surface-dark border-r border-brand-border-light dark:border-brand-border-dark overflow-y-auto p-4 space-y-5 flex flex-col">

          {/* Progress */}
          <div className="bg-brand-surface-light dark:bg-brand-bg-dark/40 border border-brand-border-light dark:border-brand-border-dark rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-brand-text-light dark:text-brand-text-dark">تقدم الفحص</span>
              <span className="font-black text-indigo-600 dark:text-brand-accent-dark">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progress}%`, background: progress === 100 ? '#16A34A' : '#6366F1' }}
              />
            </div>
            <div className="text-[10px] text-brand-muted-light dark:text-brand-muted-dark">
              تم فحص {checked} من {total} بند.
            </div>
          </div>

          {/* Overall Outcome */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-brand-muted-light dark:text-brand-muted-dark uppercase tracking-wider px-1">
              النتيجة الإجمالية
            </label>
            {[
              { k: 'good',      l: 'السيارة سليمة تماماً',       color: '#16A34A', bg: '#DCFCE7', icon: '✅' },
              { k: 'attention', l: 'تحتاج للمتابعة المباشرة',    color: '#D97706', bg: '#FEF3C7', icon: '⚠️' },
              { k: 'poor',      l: 'تحتاج إصلاحات عاجلة',       color: '#DC2626', bg: '#FEE2E2', icon: '🔴' },
            ].map(opt => (
              <button
                key={opt.k}
                type="button"
                disabled={isLocked}
                onClick={() => updateInspection(inspection.id, { overallStatus: opt.k as 'good' | 'attention' | 'poor' })}
                className="w-full text-right py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                style={{
                  border:      inspection.overallStatus === opt.k ? `2px solid ${opt.color}` : '1px solid var(--color-border-tertiary)',
                  background:  inspection.overallStatus === opt.k ? opt.bg : 'transparent',
                  color:       inspection.overallStatus === opt.k ? opt.color : 'var(--color-text-secondary)',
                  fontWeight:  inspection.overallStatus === opt.k ? '700' : '500',
                }}
              >
                <span>{opt.icon}</span>
                <span>{opt.l}</span>
              </button>
            ))}
          </div>

          {/* Inspector name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-brand-text-light dark:text-brand-text-dark px-1">اسم الفاحص</label>
            <input
              type="text"
              disabled={isLocked}
              value={inspection.inspectorName}
              onChange={e => updateInspection(inspection.id, { inspectorName: e.target.value })}
              placeholder="اسم الفاحص / التقني"
              className="w-full px-3 py-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Recommendations */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-brand-text-light dark:text-brand-text-dark px-1">التوصيات الفنية</label>
            <textarea
              disabled={isLocked}
              value={inspection.recommendations}
              onChange={e => updateInspection(inspection.id, { recommendations: e.target.value })}
              placeholder="أدخل التوصيات الفنية العامة..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-cairo"
            />
          </div>

          {/* Next inspection km */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-brand-text-light dark:text-brand-text-dark px-1">مسافة الفحص القادم (كم)</label>
            <input
              type="number"
              disabled={isLocked}
              value={inspection.nextInspectionKm || ''}
              onChange={e => updateInspection(inspection.id, { nextInspectionKm: Number(e.target.value) })}
              placeholder="مثال: 55000"
              className="w-full px-3 py-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Next inspection date */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-brand-text-light dark:text-brand-text-dark px-1">تاريخ الفحص القادم</label>
            <input
              type="date"
              disabled={isLocked}
              value={inspection.nextInspectionDate || ''}
              onChange={e => updateInspection(inspection.id, { nextInspectionDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-brand-border-light dark:border-brand-border-dark bg-brand-surface-light dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
            />
          </div>

          {/* Quick attachment shortcut */}
          {!isLocked && (
            <div
              className="border border-dashed border-indigo-300 dark:border-indigo-800 rounded-xl p-3 text-center cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors"
              onClick={() => setActiveSectionId('__attachments__')}
            >
              <Paperclip size={16} className="text-indigo-500 mx-auto mb-1" />
              <p className="text-[11px] font-bold text-indigo-600 dark:text-brand-accent-dark">
                إضافة مرفق / صورة
              </p>
              <p className="text-[10px] text-brand-muted-light dark:text-brand-muted-dark mt-0.5">
                {attachments.length > 0 ? `${attachments.length} ملفات مرفقة` : 'قياسات البطارية، جهاز التشخيص...'}
              </p>
            </div>
          )}

          <div className="flex-1" />

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t border-brand-border-light dark:border-brand-border-dark shrink-0">
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-semibold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
            >
              <Printer size={15} />
              طباعة الشهادة الفنية
            </button>

            {!isLocked && (
              <button
                onClick={handleLock}
                className="w-full flex items-center justify-center gap-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl py-2.5 text-xs font-semibold transition-all cursor-pointer"
              >
                <Lock size={14} />
                إنهاء وقفل الفحص
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
