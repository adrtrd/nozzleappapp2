import React, { useState, useRef, useEffect } from 'react';
import { useInspectionStore, TemplateSection, AVAILABLE_ICONS } from '../store/useInspectionStore';
import { motion, AnimatePresence } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';
import {
  Building2,
  Receipt,
  ShieldCheck,
  Wrench,
  Coins,
  Bell,
  Users,
  Printer,
  Database,
  MapPin,
  Mail,
  Phone,
  Globe,
  Badge,
  FileText,
  Clock,
  Calendar,
  CalendarOff,
  Plus,
  Trash2,
  Edit2,
  FolderPlus,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Palette,
  Hash,
  Type,
  File,
  Eye,
  Sliders,
  UserPlus,
  Crown,
  Headphones,
  Calculator,
  Download,
  FileSpreadsheet,
  Upload,
  Info,
  Check,
  CheckCheck,
  Star,
  Activity,
  Award,
  Droplet,
  FlaskConical,
  Gauge,
  RefreshCw,
  SlidersHorizontal,
  X,
  Minimize2,
  Maximize2,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  User,
  Power,
  ChevronRight,
  Disc,
  ArrowRightLeft,
  Smartphone,
  Lock,
  Tag,
  Percent,
  CreditCard,
  Copy,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';
import {
  useStore,
  useServiceStore,
  useVisitStore,
  User as UserType,
  Service,
  UserRole,
  Settings as SettingsType,
  ServiceCategory,
  Subcategory,
  InvoiceSettings,
  WarrantyTemplate,
  Branch,
  useAuthStore
} from '../store/store';
import { useSettingsStore } from '../store/settingsStore';
import { useInvoiceSettingsStore } from '../store/invoiceSettingsStore';
import { toast } from '../store/toastStore';
import { InvoicePrintView, LucideIcon } from '../components/InvoicePrintView';
import Modal from '../components/Modal';

class SettingsErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  state: { hasError: boolean; error: any } = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          direction: 'rtl'
        }}>
          <p style={{ fontSize: '18px', marginBottom: '12px' }}>
            ⚠️ حدث خطأ في صفحة الإعدادات
          </p>
          <pre style={{
            background: '#fee2e2',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            textAlign: 'left',
            marginBottom: '16px',
            color: '#991b1b',
            overflowX: 'auto'
          }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6366F1',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Standardized list of popular icons for categories
const serviceIcons = [
  'Wrench', 'Car', 'Settings', 'Gauge', 'Droplet', 'Compass', 'Zap', 'Shield',
  'Activity', 'Disc', 'Folder', 'FileText', 'Coins', 'DollarSign', 'CreditCard',
  'PenTool', 'Sliders', 'Star', 'Bell', 'Clock', 'Calendar', 'User', 'Users',
  'Volume2', 'Info', 'Search', 'Check', 'AlertTriangle', 'Database', 'Key', 'Lock',
  'Printer', 'Eye', 'HelpCircle', 'Home', 'Percent', 'RefreshCw', 'CheckCircle2',
  'Flame', 'Filter', 'Briefcase', 'Layers', 'Grid', 'Cpu', 'Thermometer', 'Battery',
  'Wind', 'Hammer'
];

// Reusable Tooltip component (Arabic, dark pill, max 20 chars, 400ms delay)
const Tooltip: React.FC<{ children: React.ReactNode; text: string; position?: 'below' | 'right' | 'left' | 'above' }> = ({
  children,
  text,
  position = 'below'
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<any>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, 400);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Limit tooltip length to 20 chars
  const truncatedText = text.length > 20 ? text.slice(0, 18) + '..' : text;

  return (
    <div className="relative inline-block w-full" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div
          dir="rtl"
          className={`absolute z-[99999] bg-slate-900 dark:bg-slate-800 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none transition-all duration-200 border border-slate-700/50 font-cairo ${
            position === 'below' ? 'top-full mt-2 left-1/2 -translate-x-1/2' :
            position === 'right' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
            position === 'left' ? 'left-full ml-2 top-1/2 -translate-y-1/2' :
            'bottom-full mb-2 left-1/2 -translate-x-1/2'
          }`}
        >
          {truncatedText}
        </div>
      )}
    </div>
  );
};

// Custom color picker field with HexColorPicker and hex input
interface ColorFieldProps {
  color: string;
  onChange: (color: string) => void;
  tooltip: string;
}

const ColorField: React.FC<ColorFieldProps> = ({ color, onChange, tooltip }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Tooltip text={tooltip} position="above">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-transform active:scale-95 shrink-0"
          style={{ backgroundColor: color }}
        />
      </Tooltip>
      {open && (
        <div className="absolute z-[9999] top-full mt-2 right-0 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col gap-2">
          <HexColorPicker color={color} onChange={onChange} />
          <input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-center text-xs py-1 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          />
        </div>
      )}
    </div>
  );
};

// Rich Text Editor component for Warranty Template
interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const executeCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700" dir="rtl">
        <button type="button" onClick={() => executeCommand('bold')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-bold text-xs min-w-[28px] text-slate-700 dark:text-slate-200">B</button>
        <button type="button" onClick={() => executeCommand('italic')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded italic text-xs min-w-[28px] text-slate-700 dark:text-slate-200">I</button>
        <button type="button" onClick={() => executeCommand('underline')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded underline text-xs min-w-[28px] text-slate-700 dark:text-slate-200">U</button>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
        <button type="button" onClick={() => executeCommand('insertUnorderedList')} className="px-2.5 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-[11px] text-slate-700 dark:text-slate-200">• قائمة</button>
        <button type="button" onClick={() => executeCommand('insertOrderedList')} className="px-2.5 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-[11px] text-slate-700 dark:text-slate-200">1. قائمة</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="p-4 min-h-[140px] focus:outline-none text-right text-sm leading-relaxed bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
        dir="rtl"
      />
    </div>
  );
};

// Dynamic Icon picker popover
interface IconPickerProps {
  selectedIcon: string;
  onChange: (icon: string) => void;
  tooltip: string;
}

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onChange, tooltip }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredIcons = serviceIcons.filter(icon =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative select-none">
      <Tooltip text={tooltip} position="above">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 shrink-0"
        >
          <LucideIcon name={selectedIcon} size={18} />
        </button>
      </Tooltip>

      {open && (
        <div className="absolute z-[9999] top-full mt-2 right-0 w-64 bg-white dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col gap-2">
          <input
            type="text"
            placeholder="ابحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right font-cairo"
          />
          <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto p-1 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/30">
            {filteredIcons.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => {
                  onChange(iconName);
                  setOpen(false);
                }}
                className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
                  selectedIcon === iconName
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400'
                }`}
              >
                <LucideIcon name={iconName} size={14} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable label-free Input with status checkmark flash on auto-save
interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ComponentType<{ size: number; className?: string }>;
  tooltip?: string;
  fieldKey?: string;
  savedFields?: Record<string, boolean>;
}

const IconInput: React.FC<IconInputProps> = ({ icon: Icon, tooltip, fieldKey, savedFields, ...props }) => {
  const [focused, setFocused] = useState(false);

  const inputEl = (
    <div className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-lg border transition-all w-full ${
      focused
        ? 'border-indigo-500 ring-1 ring-indigo-500 bg-white dark:bg-slate-800'
        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
    }`}>
      <Icon
        size={18}
        className={focused ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}
      />
      <input
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className="flex-1 border-none bg-transparent outline-none text-[14px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-right pr-1 font-cairo"
      />
      {fieldKey && savedFields?.[fieldKey] && (
        <Tooltip text="تم الحفظ ✓" position="above">
          <CheckCheck size={16} className="text-green-500 animate-pulse ml-1 shrink-0" />
        </Tooltip>
      )}
    </div>
  );

  if (tooltip) {
    return (
      <div className="w-full">
        <Tooltip text={tooltip} position="right">
          {inputEl}
        </Tooltip>
      </div>
    );
  }
  return inputEl;
};

// Reusable label-free Select
interface IconSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon: React.ComponentType<{ size: number; className?: string }>;
  tooltip?: string;
  fieldKey?: string;
  savedFields?: Record<string, boolean>;
}

const IconSelect: React.FC<IconSelectProps> = ({ icon: Icon, tooltip, fieldKey, savedFields, children, ...props }) => {
  const [focused, setFocused] = useState(false);

  const selectEl = (
    <div className={`relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border transition-all w-full ${
      focused
        ? 'border-indigo-500 ring-1 ring-indigo-500 bg-white dark:bg-slate-800'
        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
    }`}>
      <Icon
        size={18}
        className={focused ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}
      />
      <select
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className="flex-1 border-none bg-transparent outline-none text-[14px] text-slate-800 dark:text-slate-100 bg-transparent text-right cursor-pointer font-cairo"
      >
        {children}
      </select>
      {fieldKey && savedFields?.[fieldKey] && (
        <Tooltip text="تم الحفظ ✓" position="above">
          <CheckCheck size={16} className="text-green-500 animate-pulse ml-1 shrink-0" />
        </Tooltip>
      )}
    </div>
  );

  if (tooltip) {
    return (
      <div className="w-full">
        <Tooltip text={tooltip} position="right">
          {selectEl}
        </Tooltip>
      </div>
    );
  }
  return selectEl;
};

// Local Logo Upload Zone component
const LogoUploadZone: React.FC = () => {
  const settingsStore = useSettingsStore();
  const logoBase64 = settingsStore.invoice?.logoBase64;
  const setLogo = settingsStore.setLogo;
  const removeLogo = settingsStore.removeLogo;

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const compressImage = (file: File, maxWidth = 400): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('نوع الملف غير مدعوم. استخدم PNG أو JPG أو SVG');
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('حجم الملف كبير. الحد الأقصى ٢ ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      let base64String = e.target?.result as string;
      if (base64String.length > 3 * 1024 * 1024) {
        toast.warning('حجم الصورة كبير لـ localStorage. يتم ضغط الصورة تلقائياً...');
        base64String = await compressImage(file);
      }
      setLogo(base64String);
      toast.success('تم رفع الشعار بنجاح ✓');
    };
    reader.onerror = () => {
      toast.error('حدث خطأ أثناء قراءة الملف');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".png,.jpg,.jpeg,.svg,.webp"
        onChange={(e) => handleLogoUpload(e.target.files?.[0])}
      />

      {!logoBase64 ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
            dragActive
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/10 hover:border-indigo-500'
          }`}
        >
          <ImageIcon size={32} className="text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-cairo">
            اسحب الشعار وأفلته هنا أو اختر من جهازك
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            PNG • JPG • SVG • WEBP • حتى ٢MB
          </span>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900/10">
          <div className="w-24 h-24 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-1.5 flex items-center justify-center">
            <img
              src={logoBase64}
              alt="شعار المركز"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1 font-semibold">
            <CheckCheck size={12} /> الشعار محفوظ محلياً
          </span>
          <div className="flex gap-2">
            <Tooltip text="تغيير الشعار" position="above">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center hover:bg-indigo-100 transition-colors"
              >
                <RefreshCw size={14} strokeWidth={1.5} />
              </button>
            </Tooltip>
            <Tooltip text="حذف الشعار" position="above">
              <button
                type="button"
                onClick={removeLogo}
                className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 flex items-center justify-center hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

// MAIN SETTINGS COMPONENT
const Settings: React.FC = () => {
  // Store retrieval
  const currentUser = useStore((state) => state.currentUser);
  const settings = useStore((state) => state.settings);
  const invoiceSettings = useStore((state) => state.invoiceSettings);
  
  const lastNum = useSettingsStore((s) => s.lastInvoiceNumber);
  const resetCounter = useSettingsStore((s) => s.resetInvoiceCounter);
  const updateInv = useSettingsStore((s) => s.updateInvoice);

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-tertiary, #cbd5e1)',
    backgroundColor: 'var(--color-background-secondary, #f8fafc)',
    color: 'var(--color-text-primary, #0f172a)',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
  };

  const warrantyTemplates = useStore((state) => state.warrantyTemplates);
  const users = useStore((state) => state.users);
  const services = useStore((state) => state.services);
  const serviceCategories = useStore((state) => state.serviceCategories);
  const permissionsMatrix = useStore((state) => state.permissionsMatrix);
  const servicePackages = useStore((state) => state.servicePackages) || [];

  // Actions
  const updateSettings = useStore((state) => state.updateSettings);
  const updateInvoiceSettings = useStore((state) => state.updateInvoiceSettings);
  const addWarrantyTemplate = useStore((state) => state.addWarrantyTemplate);
  const updateWarrantyTemplate = useStore((state) => state.updateWarrantyTemplate);
  const deleteWarrantyTemplate = useStore((state) => state.deleteWarrantyTemplate);

  // Users Actions
  const addUser = useStore((state) => state.addUser);
  const updateUser = useStore((state) => state.updateUser);
  const deleteUser = useStore((state) => state.deleteUser);
  const updatePermissions = useStore((state) => state.updatePermissions);

  // Services Actions
  const addCategory = useStore((state) => state.addCategory);
  const updateCategory = useStore((state) => state.updateCategory);
  const deleteCategory = useStore((state) => state.deleteCategory);
  const addSubcategory = useStore((state) => state.addSubcategory);
  const updateSubcategory = useStore((state) => state.updateSubcategory);
  const deleteSubcategory = useStore((state) => state.deleteSubcategory);
  const addService = useStore((state) => state.addService);
  const updateService = useStore((state) => state.updateService);
  const deleteService = useStore((state) => state.deleteService);
  const reorderCategories = useStore((state) => state.reorderCategories);

  // Backup Import/Export Actions
  const importData = useStore((state) => state.importData);

  // Local state
  const [activeTab, setActiveTab] = useState<'center' | 'invoice' | 'warranty' | 'services' | 'finance' | 'reminders' | 'users' | 'print' | 'data' | 'inspections'>('center');

  // ── Inspection Template Store ──
  const inspectionTemplate = useInspectionStore(s => s.inspectionTemplate);
  const addTemplateSection = useInspectionStore(s => s.addTemplateSection);
  const updateTemplateSection = useInspectionStore(s => s.updateTemplateSection);
  const deleteTemplateSection = useInspectionStore(s => s.deleteTemplateSection);
  const addTemplateItem = useInspectionStore(s => s.addTemplateItem);
  const updateTemplateItem = useInspectionStore(s => s.updateTemplateItem);
  const deleteTemplateItem = useInspectionStore(s => s.deleteTemplateItem);
  const resetTemplateToDefault = useInspectionStore(s => s.resetTemplateToDefault);

  // ── Inspection template local UI state ──
  const [insp_expandedSection, setInsp_expandedSection] = useState<string | null>(null);
  const [insp_editSectionId, setInsp_editSectionId] = useState<string | null>(null);
  const [insp_editSectionName, setInsp_editSectionName] = useState('');
  const [insp_editSectionIcon, setInsp_editSectionIcon] = useState('Wrench');
  const [insp_editSectionColor, setInsp_editSectionColor] = useState('#6366F1');
  const [insp_newSectionName, setInsp_newSectionName] = useState('');
  const [insp_newSectionIcon, setInsp_newSectionIcon] = useState('Wrench');
  const [insp_newSectionColor, setInsp_newSectionColor] = useState('#6366F1');
  const [insp_editItemId, setInsp_editItemId] = useState<string | null>(null);
  const [insp_editItemName, setInsp_editItemName] = useState('');
  const [insp_editItemNameEn, setInsp_editItemNameEn] = useState('');
  const [insp_newItemName, setInsp_newItemName] = useState<Record<string, string>>({});
  const [insp_newItemNameEn, setInsp_newItemNameEn] = useState<Record<string, string>>({});
  const [savedFields, setSavedFields] = useState<Record<string, boolean>>({});

  // Auto-save helpers
  const triggerSavedFlash = (key: string) => {
    setSavedFields((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSavedFields((prev) => ({ ...prev, [key]: false }));
    }, 1500);
  };

  const handleUpdateSetting = (key: string, value: any) => {
    updateSettings({ [key]: value });
    triggerSavedFlash(key);
  };

  const handleUpdateInvoiceSetting = (key: string, value: any) => {
    updateInvoiceSettings({ [key]: value });
    triggerSavedFlash(key);
  };

  // ================= 🏢 TAB: GENERAL (المركز) =================
  const [newHoliday, setNewHoliday] = useState('');

  // ================= 🛡 TAB: WARRANTY (الضمان) =================
  const [editingWarranty, setEditingWarranty] = useState<WarrantyTemplate | null>(null);
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [warrantyName, setWarrantyName] = useState('');
  const [warrantyType, setWarrantyType] = useState<'general' | 'category'>('general');
  const [warrantyCatId, setWarrantyCatId] = useState('');
  const [warrantyContent, setWarrantyContent] = useState('');
  const [warrantyIsDefault, setWarrantyIsDefault] = useState(false);
  const [warrantyIsActive, setWarrantyIsActive] = useState(true);

  const handleOpenWarrantyAdd = () => {
    setEditingWarranty(null);
    setWarrantyName('');
    setWarrantyType('general');
    setWarrantyCatId('');
    setWarrantyContent('');
    setWarrantyIsDefault(false);
    setWarrantyIsActive(true);
    setIsWarrantyModalOpen(true);
  };

  const handleStartEditWarranty = (wt: WarrantyTemplate) => {
    setEditingWarranty(wt);
    setWarrantyName(wt.name);
    setWarrantyType(wt.type);
    setWarrantyCatId(wt.categoryId || '');
    setWarrantyContent(wt.content);
    setWarrantyIsDefault(wt.isDefault);
    setWarrantyIsActive(wt.isActive);
    setIsWarrantyModalOpen(true);
  };

  const handleWarrantySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyName.trim() || !warrantyContent.trim()) {
      toast.error('الرجاء تعبئة اسم وشروط الضمان');
      return;
    }

    const tData = {
      name: warrantyName,
      type: warrantyType,
      categoryId: warrantyType === 'category' ? warrantyCatId : undefined,
      content: warrantyContent,
      isDefault: warrantyIsDefault,
      isActive: warrantyIsActive,
      variables: ['[brand]', '[viscosity]', '[next_change_km]', '[next_change_date]']
    };

    if (editingWarranty) {
      updateWarrantyTemplate(editingWarranty.id, tData);
      toast.success('تم تحديث نموذج الضمان ✓');
    } else {
      addWarrantyTemplate(tData);
      toast.success('تمت إضافة نموذج الضمان ✓');
    }
    setIsWarrantyModalOpen(false);
  };

  // ================= 🔧 TAB: SERVICES (الخدمات) =================
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ServiceCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catIcon, setCatIcon] = useState('Wrench');
  const [catColor, setCatColor] = useState('#6366F1');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [newSubcatName, setNewSubcatName] = useState<Record<string, string>>({});

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCat) {
      updateCategory(editingCat.id, {
        name: catName,
        nameEn: catNameEn,
        icon: catIcon,
        color: catColor
      });
      toast.success('تم تعديل التصنيف بنجاح ✓');
    } else {
      addCategory({
        name: catName,
        nameEn: catNameEn,
        icon: catIcon,
        color: catColor,
        sortOrder: serviceCategories.length + 1,
        isActive: true,
        subcategories: []
      });
      toast.success('تم إضافة التصنيف بنجاح ✓');
    }
    setIsCatModalOpen(false);
  };

  const handleStartEditCat = (cat: ServiceCategory) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatNameEn(cat.nameEn || '');
    setCatIcon(cat.icon);
    setCatColor(cat.color || '#6366F1');
    setIsCatModalOpen(true);
  };

  // Category Drag and Drop sorting (custom lightweight HTML5 implementation)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const list = [...serviceCategories];
    const item = list.splice(draggedIdx, 1)[0];
    list.splice(index, 0, item);
    reorderCategories(list);
    setDraggedIdx(null);
    toast.success('تمت إعادة ترتيب التصنيفات ✓');
  };



  // ================= 👥 TAB: USERS (المستخدمون) =================
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('technician');

  const handleOpenUserAdd = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserRole('technician');
    setIsUserModalOpen(true);
  };

  const handleStartEditUser = (user: UserType) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setUserPassword('');
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      toast.error('الرجاء إدخال الاسم والبريد الإلكتروني');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: userName,
        email: userEmail,
        role: userRole,
        ...(userPassword ? { password: userPassword } : {})
      });
      toast.success('تم تعديل بيانات المستخدم بنجاح ✓');
    } else {
      if (!userPassword) {
        toast.error('كلمة المرور مطلوبة للمستخدم الجديد');
        return;
      }
      const emailExists = users.some((u: UserType) => u.email.toLowerCase() === userEmail.toLowerCase());
      if (emailExists) {
        toast.error('البريد الإلكتروني مسجل مسبقاً لمستخدم آخر');
        return;
      }
      addUser({
        name: userName,
        email: userEmail,
        role: userRole,
        password: userPassword
      });
      toast.success('تمت إضافة المستخدم بنجاح ✓');
    }
    setIsUserModalOpen(false);
  };

  // Permissions matrix helper
  const handleTogglePermission = (role: UserRole, section: string, action: string) => {
    const currentPerms = { ...permissionsMatrix[role] };
    const sectionPerms = { ...currentPerms[section as keyof typeof currentPerms] };
    const nextVal = !sectionPerms[action as keyof typeof sectionPerms];

    updatePermissions(role, section, {
      ...sectionPerms,
      [action]: nextVal
    });
    toast.success('تم تحديث الصلاحية ✓');
  };

  // ================= 💾 TAB: DATABASE (البيانات والنسخ الاحتياطي) =================
  const [showStats, setShowStats] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup handlers
  const handleExportJSON = () => {
    const allData = {
      users: useStore.getState().users,
      customers: useStore.getState().customers,
      cars: useStore.getState().cars,
      visits: useStore.getState().visits,
      invoices: useStore.getState().invoices,
      settings: useStore.getState().settings,
      invoiceSettings: useStore.getState().invoiceSettings,
      warrantyTemplates: useStore.getState().warrantyTemplates,
      serviceCategories: useStore.getState().serviceCategories,
      services: useStore.getState().services
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nozzle_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('تم تصدير نسخة JSON بنجاح ✓');
  };

  const handleExportCSV = () => {
    const invoices = useStore.getState().invoices || [];
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "رقم الفاتورة,تاريخ الصيانة,العميل,السيارة,الإجمالي,حالة الدفع\n";
    invoices.forEach((inv: any) => {
      csvContent += `"${inv.invoiceNumber}","${inv.issuedAt}","${inv.customerName || ''}","${inv.carName || ''}","${inv.total}","${inv.paymentStatus || ''}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `nozzle_invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('تم تصدير تقرير Excel بنجاح ✓');
  };

  const handleImportJSONFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const res = importData(JSON.stringify(parsed));
        if (res.success) {
          toast.success('تم استعادة النسخة الاحتياطية بنجاح ✓');
        } else {
          toast.error(res.error || 'فشل استيراد البيانات');
        }
      } catch (err) {
        toast.error('ملف النسخة الاحتياطية غير صالح أو تالف');
      }
    };
    reader.readAsText(file);
  };

  const handleWipeAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Database stats calculation
  const customersCount = useStore((state) => state.customers?.length || 0);
  const carsCount = useStore((state) => state.cars?.length || 0);
  const visitsCount = useStore((state) => state.visits?.length || 0);
  const invoicesCount = useStore((state) => state.invoices?.length || 0);
  const [dataSizeKB, setDataSizeKB] = useState(0);

  useEffect(() => {
    const storeState = useStore.getState();
    const size = new Blob([JSON.stringify(storeState)]).size;
    setDataSizeKB(Math.round((size / 1024) * 100) / 100);
  }, [customersCount, carsCount, visitsCount, invoicesCount]);

  // Color Preset Presets Helper
  const colorPresets = [
    { name: 'Classic Dark', headerBg: '#0F172A', headerText: '#FFFFFF', accent: '#6366F1' },
    { name: 'Midnight Blue', headerBg: '#1E3A8A', headerText: '#FFFFFF', accent: '#3B82F6' },
    { name: 'Forest Green', headerBg: '#064E3B', headerText: '#FFFFFF', accent: '#10B981' },
    { name: 'Burgundy', headerBg: '#701A75', headerText: '#FFFFFF', accent: '#D946EF' },
    { name: 'Slate Gray', headerBg: '#334155', headerText: '#FFFFFF', accent: '#64748B' },
    { name: 'Pure White', headerBg: '#FFFFFF', headerText: '#1E293B', accent: '#0F172A' }
  ];

  const handleApplyPreset = (preset: typeof colorPresets[0]) => {
    updateInvoiceSettings({
      colorScheme: preset.name,
      headerBgColor: preset.headerBg,
      headerTextColor: preset.headerText,
      accentColor: preset.accent
    });
    toast.success(`تم تطبيق المظهر الملون: ${preset.name}`);
  };

  // Mock Invoice preview data
  const mockVisit = {
    id: 'VIS-98012',
    entryDate: new Date().toISOString().split('T')[0],
    entryOdometer: 85400,
    notes: 'ملاحظة الفحص العام: الفرامل الأمامية بحاجة لاستبدال خلال 2000 كم، تم تغيير الزيت والفلتر بطلب العميل.'
  };

  const mockCustomer = {
    name: 'أحمد الفاروق',
    phone: '07709876543',
    address: 'بغداد، المنصور، قرب ساحة اللقاء'
  };

  const mockCar = {
    brand: 'تويوتا',
    name: 'لاندكروزر V8',
    year: 2022,
    color: 'لؤلؤي أبيض',
    plateNumber: 'بغداد - 90812 أ',
    chassisNumber: 'VIN892182LANDCRUISER092'
  };

  const mockServices = [
    {
      id: 'mock-vs1',
      serviceName: 'زيت المحرك (Engine Oil)',
      categoryName: 'الزيوت',
      qty: 6,
      unit: 'لتر',
      unitPrice: 10000,
      totalPrice: 60000,
      oilDetails: {
        brand: 'Mobil 1',
        productName: 'Advanced Synthetic',
        viscosity: '5W-30',
        oilType: 'تركيبي بالكامل',
        nextChangeOdometer: 95400,
        nextChangeDate: new Date(Date.now() + 3600000 * 24 * 90).toISOString().split('T')[0]
      }
    },
    {
      id: 'mock-vs2',
      serviceName: 'فلتر زيت محرك',
      categoryName: 'الفلاتر',
      qty: 1,
      unit: 'قطعة',
      unitPrice: 15000,
      totalPrice: 15000,
      oilDetails: null
    }
  ];

  const mockInvoice = {
    invoiceNumber: `${invoiceSettings.invoicePrefix || 'INV-'}${new Date().getFullYear()}-0024`,
    subtotal: 75000,
    discount: settings.discountRules?.amount || 5000,
    discountType: settings.discountRules?.type || 'flat',
    tax: settings.taxRate || 0,
    total: 70000,
    issuedAt: new Date().toISOString().split('T')[0]
  };

  const mockPayment = {
    method: 'cash' as const,
    status: 'paid' as const,
    totalAmount: 70000,
    paidAmount: 70000,
    remainingAmount: 0,
    dueDate: new Date().toISOString().split('T')[0]
  };

  const SETTINGS_TABS = [
    { id: 'center',      icon: Building2,     label: 'المركز' },
    { id: 'invoice',     icon: Receipt,       label: 'الفاتورة' },
    { id: 'warranty',    icon: ShieldCheck,   label: 'الضمان' },
    { id: 'services',    icon: Wrench,        label: 'الخدمات' },
    { id: 'finance',     icon: Coins,         label: 'المالية' },
    { id: 'reminders',   icon: Bell,          label: 'التذكيرات' },
    { id: 'users',       icon: Users,         label: 'المستخدمون' },
    { id: 'print',       icon: Printer,       label: 'الطباعة' },
    { id: 'inspections', icon: ClipboardList, label: 'قوائم الفحص' },
    { id: 'data',        icon: Database,      label: 'البيانات' },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50 dark:bg-slate-900" dir="rtl">
      {/* 64px wide Sidebar navigation */}
      <div className="w-16 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col items-center py-6 gap-5 shrink-0 z-10 shadow-sm">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Tooltip key={tab.id} text={tab.label} position="below">
              <button
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={22} strokeWidth={1.5} />
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 font-cairo">
        <SettingsErrorBoundary>
          {activeTab === 'invoice' ? (
          /* Split panel layout for invoice customization (40% Panel, 60% Live A4 Preview) */
          <div className="grid grid-cols-1 xl:grid-cols-10 gap-8 h-full items-start">
            <div className="xl:col-span-4 space-y-6 overflow-y-auto pr-1">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Receipt size={22} strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400" />
                تخصيص الفاتورة
              </h2>

              {/* Logo sub-section */}
              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={18} strokeWidth={1.5} /> الشعار والموضع
                </h3>
                <LogoUploadZone />

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <div className="flex gap-2">
                    {[
                      { key: 'left', icon: AlignLeft, label: 'يسار' },
                      { key: 'center', icon: AlignCenter, label: 'وسط' },
                      { key: 'right', icon: AlignRight, label: 'يمين' }
                    ].map((pos) => (
                      <Tooltip key={pos.key} text={pos.label} position="above">
                        <button
                          type="button"
                          onClick={() => handleUpdateInvoiceSetting('logoPosition', pos.key)}
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                            invoiceSettings.logoPosition === pos.key
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'
                          }`}
                        >
                          <pos.icon size={16} strokeWidth={1.5} />
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {[
                      { key: 'small', icon: Minimize2, label: 'صغير' },
                      { key: 'medium', icon: Square, label: 'متوسط' },
                      { key: 'large', icon: Maximize2, label: 'كبير' }
                    ].map((sz) => (
                      <Tooltip key={sz.key} text={sz.label} position="above">
                        <button
                          type="button"
                          onClick={() => handleUpdateInvoiceSetting('logoSize', sz.key)}
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                            invoiceSettings.logoSize === sz.key
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'
                          }`}
                        >
                          <sz.icon size={16} strokeWidth={1.5} />
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color customization */}
              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Palette size={18} strokeWidth={1.5} /> ألوان الفاتورة
                </h3>

                <div className="flex flex-wrap items-center gap-3">
                  <ColorField
                    color={invoiceSettings.headerBgColor}
                    onChange={(color) => handleUpdateInvoiceSetting('headerBgColor', color)}
                    tooltip="لون خلفية الهيدر"
                  />
                  <ColorField
                    color={invoiceSettings.headerTextColor}
                    onChange={(color) => handleUpdateInvoiceSetting('headerTextColor', color)}
                    tooltip="لون نص الهيدر"
                  />
                  <ColorField
                    color={invoiceSettings.accentColor}
                    onChange={(color) => handleUpdateInvoiceSetting('accentColor', color)}
                    tooltip="لون الشريط والتميز"
                  />

                  {/* Color Scheme presets circles */}
                  <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-800 pr-3 mr-1">
                    {colorPresets.map((preset) => (
                      <Tooltip key={preset.name} text={preset.name} position="above">
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className={`w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 transition-transform`}
                          style={{
                            background: `linear-gradient(135deg, ${preset.headerBg} 50%, ${preset.accent} 50%)`
                          }}
                        />
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>

              {/* Invoice Number prefix, start, zero padding */}
              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Hash size={18} strokeWidth={1.5} /> ترقيم الفواتير
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

                  {/* Prefix */}
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <Hash size={18} color="var(--color-text-secondary)" />
                    <input
                      value={invoiceSettings.invoicePrefix || 'INV-'}
                      onChange={e => updateInvoiceSettings({ invoicePrefix: e.target.value })}
                      placeholder="INV-"
                      style={inputStyle}
                    />
                  </div>

                  {/* Zero padding */}
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <Type size={18} color="var(--color-text-secondary)" />
                    <select
                      value={invoiceSettings.zeroPadding || 4}
                      onChange={e => updateInvoiceSettings({ zeroPadding: Number(e.target.value) })}
                      style={inputStyle}
                    >
                      <option value={3}>3 أرقام — 001</option>
                      <option value={4}>4 أرقام — 0001</option>
                      <option value={5}>5 أرقام — 00001</option>
                    </select>
                  </div>

                  {/* Current counter */}
                  <div style={{
                    background: 'var(--color-background-secondary)',
                    border: '1px solid var(--color-border-tertiary)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize:'13px',
                                   color:'var(--color-text-secondary)' }}>
                      آخر رقم فاتورة: 
                      <strong style={{ color:'var(--color-text-primary)',
                                       marginRight:'6px' }}>
                        {invoiceSettings.invoicePrefix || 'INV-'}
                        {String(lastNum || 0).padStart(invoiceSettings.zeroPadding || 4, '0')}
                      </strong>
                    </span>
                    <button
                      onClick={() => {
                        if (confirm('هل تريد إعادة العداد إلى صفر؟ ستبدأ الفواتير من 0001 من جديد'))
                          resetCounter();
                      }}
                      style={{
                        background: '#FEE2E2', color: '#DC2626',
                        border: 'none', borderRadius: '6px',
                        padding: '5px 12px', fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      إعادة تعيين
                    </button>
                  </div>
                </div>
              </div>

              {/* Font selection */}
              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Type size={18} strokeWidth={1.5} /> الخط والحجم
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <IconSelect
                    icon={Type}
                    tooltip="نوع الخط العربي"
                    fieldKey="fontFamily"
                    savedFields={savedFields}
                    value={invoiceSettings.fontFamily}
                    onChange={(e) => handleUpdateInvoiceSetting('fontFamily', e.target.value)}
                  >
                    <option value="Tajawal">Tajawal (عصري)</option>
                    <option value="Cairo">Cairo (رسمي)</option>
                    <option value="Noto Sans Arabic">Noto Arabic (مستقيم)</option>
                    <option value="IBM Plex Arabic">IBM Plex (تقني)</option>
                  </IconSelect>

                  <IconSelect
                    icon={Type}
                    tooltip="حجم الخط الأساسي"
                    fieldKey="baseFontSize"
                    savedFields={savedFields}
                    value={invoiceSettings.baseFontSize}
                    onChange={(e) => handleUpdateInvoiceSetting('baseFontSize', e.target.value)}
                  >
                    <option value="9pt">٩ نقطة (صغير)</option>
                    <option value="10pt">١٠ نقطة (متوسط)</option>
                    <option value="11pt">١١ نقطة (كبير)</option>
                  </IconSelect>
                </div>
              </div>

              {/* Paper size */}
              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <File size={18} strokeWidth={1.5} /> حجم الورقة الافتراضية
                </h3>
                <IconSelect
                  icon={File}
                  tooltip="حجم الورقة"
                  fieldKey="paperSize"
                  savedFields={savedFields}
                  value={invoiceSettings.paperSize}
                  onChange={(e) => handleUpdateInvoiceSetting('paperSize', e.target.value)}
                >
                  <option value="A4">A4 (افتراضي)</option>
                  <option value="A5">A5 (نصف A4)</option>
                  <option value="Letter">Letter</option>
                </IconSelect>
              </div>

              {/* Sections visibility toggles */}
              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Eye size={18} strokeWidth={1.5} /> عرض أقسام الفاتورة
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'customer', icon: User, label: 'عميل' },
                    { key: 'vehicle', icon: Wrench, label: 'سيارة' }, // fallback icon for vehicle
                    { key: 'services', icon: Wrench, label: 'خدمات' },
                    { key: 'totals', icon: Calculator, label: 'إجماليات' },
                    { key: 'payment', icon: Coins, label: 'دفع' },
                    { key: 'notes', icon: FileText, label: 'ملاحظات' },
                    { key: 'warranty', icon: ShieldCheck, label: 'ضمان' },
                    { key: 'terms', icon: FileText, label: 'شروط' },
                    { key: 'signature', icon: Edit2, label: 'توقيع' }
                  ].map((sec) => (
                    <Tooltip key={sec.key} text={sec.label} position="above">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateInvoiceSetting('sections', {
                            ...invoiceSettings.sections,
                            [sec.key]: !invoiceSettings.sections[sec.key as keyof typeof invoiceSettings.sections]
                          })
                        }
                        className={`w-full py-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors ${
                          invoiceSettings.sections[sec.key as keyof typeof invoiceSettings.sections]
                            ? 'border-indigo-600 bg-indigo-50/30 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <sec.icon size={18} strokeWidth={1.5} />
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Table columns visibility toggles */}
              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Printer size={18} strokeWidth={1.5} /> أعمدة جدول الخدمات
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'num', icon: Hash, label: 'رقم' },
                    { key: 'badge', icon: Award, label: 'تصنيف' },
                    { key: 'name', icon: Wrench, label: 'خدمة' },
                    { key: 'details', icon: FileText, label: 'تفاصيل' },
                    { key: 'qty', icon: Calculator, label: 'كمية' },
                    { key: 'unit', icon: SlidersHorizontal, label: 'وحدة' },
                    { key: 'unitPrice', icon: Coins, label: 'سعر الوحدة' },
                    { key: 'total', icon: Coins, label: 'إجمالي' },
                    { key: 'notes', icon: FileText, label: 'ملاحظة' }
                  ].map((col) => (
                    <Tooltip key={col.key} text={col.label} position="above">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateInvoiceSetting('tableColumns', {
                            ...invoiceSettings.tableColumns,
                            [col.key]: !invoiceSettings.tableColumns[col.key as keyof typeof invoiceSettings.tableColumns]
                          })
                        }
                        className={`w-full py-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors ${
                          invoiceSettings.tableColumns[col.key as keyof typeof invoiceSettings.tableColumns]
                            ? 'border-indigo-600 bg-indigo-50/30 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <col.icon size={18} strokeWidth={1.5} />
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>

            {/* Live A4 Print preview Panel (60% width) */}
            <div className="xl:col-span-6 bg-slate-200 dark:bg-slate-800 rounded-3xl p-6 shadow-inner border border-slate-350 dark:border-slate-700/80 sticky top-2 flex justify-center overflow-x-auto min-h-[85vh]">
              <div className="shadow-2xl border bg-white dark:bg-white text-black p-6 rounded-none w-[210mm] min-h-[297mm] transform origin-top shrink-0 scale-95 md:scale-100">
                <InvoicePrintView
                  visit={mockVisit}
                  customer={mockCustomer}
                  car={mockCar}
                  technician={{ name: 'فادي علي' }}
                  currentVisitServices={mockServices}
                  invoice={mockInvoice}
                  payment={mockPayment}
                  settings={settings}
                  invoiceSettings={invoiceSettings}
                  isLivePreview={true}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Classical Single Column Settings Sections */
          <div className="max-w-4xl mx-auto space-y-8">
            {/* ================= 🏢 TAB: GENERAL (المركز) ================= */}
            {activeTab === 'center' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Building2 size={22} strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400" />
                  معلومات مركز خدمة السيارات
                </h2>

                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                  <IconInput
                    icon={Building2}
                    fieldKey="centerName"
                    savedFields={savedFields}
                    value={settings.centerName}
                    onChange={(e) => handleUpdateSetting('centerName', e.target.value)}
                    placeholder="اسم المركز"
                    tooltip="اسم مركز الصيانة"
                  />
                  <IconInput
                    icon={MapPin}
                    fieldKey="address"
                    savedFields={savedFields}
                    value={settings.address}
                    onChange={(e) => handleUpdateSetting('address', e.target.value)}
                    placeholder="العنوان بالتفصيل"
                    tooltip="العنوان الوطني للمركز"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <IconInput
                      icon={Phone}
                      fieldKey="phone"
                      savedFields={savedFields}
                      value={settings.phone}
                      onChange={(e) => handleUpdateSetting('phone', e.target.value)}
                      placeholder="رقم الهاتف"
                      tooltip="رقم تواصل العملاء"
                    />
                    <IconInput
                      icon={Mail}
                      fieldKey="email"
                      savedFields={savedFields}
                      value={settings.email}
                      onChange={(e) => handleUpdateSetting('email', e.target.value)}
                      placeholder="البريد الإلكتروني"
                      tooltip="البريد الإلكتروني للمركز"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <IconInput
                      icon={Globe}
                      fieldKey="website"
                      savedFields={savedFields}
                      value={settings.website}
                      onChange={(e) => handleUpdateSetting('website', e.target.value)}
                      placeholder="الموقع الإلكتروني"
                      tooltip="رابط الموقع الإلكتروني للمركز"
                    />
                    <IconInput
                      icon={Badge}
                      fieldKey="crNumber"
                      savedFields={savedFields}
                      value={settings.crNumber || ''}
                      onChange={(e) => handleUpdateSetting('crNumber', e.target.value)}
                      placeholder="رقم السجل التجاري"
                      tooltip="رقم السجل التجاري الرسمي"
                    />
                    <IconInput
                      icon={FileText}
                      fieldKey="taxNumber"
                      savedFields={savedFields}
                      value={settings.taxNumber || ''}
                      onChange={(e) => handleUpdateSetting('taxNumber', e.target.value)}
                      placeholder="الرقم الضريبي للمركز"
                      tooltip="الرقم الضريبي لدى هيئة الضرائب"
                    />
                  </div>
                </div>

                {/* Working hours list */}
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Clock size={18} strokeWidth={1.5} className="text-indigo-600" />
                    أوقات العمل الرسمية للمركز
                  </h3>
                  <div className="space-y-3">
                    {settings.workingHours.map((dayRow: any, idx: number) => (
                      <div key={dayRow.day} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {/* Day tooltip on Calendar icon */}
                        <Tooltip text={dayRow.day} position="right">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                            <Calendar size={18} strokeWidth={1.5} />
                          </div>
                        </Tooltip>

                        {/* Open toggle switch */}
                        <Tooltip text="حالة اليوم" position="above">
                          <input
                            type="checkbox"
                            checked={dayRow.isOpen}
                            onChange={(e) => {
                              const updated = [...settings.workingHours];
                              updated[idx] = { ...dayRow, isOpen: e.target.checked, hours: e.target.checked ? dayRow.hours : 'مغلق' };
                              handleUpdateSetting('workingHours', updated);
                            }}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </Tooltip>

                        {/* Time interval input values (placeholder includes day name) */}
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            disabled={!dayRow.isOpen}
                            value={dayRow.hours.split(' - ')[0] || ''}
                            onChange={(e) => {
                              const updated = [...settings.workingHours];
                              const endHour = dayRow.hours.split(' - ')[1] || '09:00 م';
                              updated[idx] = { ...dayRow, hours: `${e.target.value} - ${endHour}` };
                              handleUpdateSetting('workingHours', updated);
                            }}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-right disabled:opacity-50 text-slate-800 dark:text-slate-100"
                            placeholder={`من (${dayRow.day})`}
                          />
                          <input
                            type="text"
                            disabled={!dayRow.isOpen}
                            value={dayRow.hours.split(' - ')[1] || ''}
                            onChange={(e) => {
                              const updated = [...settings.workingHours];
                              const startHour = dayRow.hours.split(' - ')[0] || '08:00 ص';
                              updated[idx] = { ...dayRow, hours: `${startHour} - ${e.target.value}` };
                              handleUpdateSetting('workingHours', updated);
                            }}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-right disabled:opacity-50 text-slate-800 dark:text-slate-100"
                            placeholder={`إلى (${dayRow.day})`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Holiday configuration */}
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <CalendarOff size={18} strokeWidth={1.5} className="text-red-500" />
                    أيام الإجازات والعطل الاستثنائية
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newHoliday}
                      onChange={(e) => setNewHoliday(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none text-right"
                    />
                    <Tooltip text="إضافة العطلة" position="above">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newHoliday || settings.holidays.includes(newHoliday)) return;
                          handleUpdateSetting('holidays', [...settings.holidays, newHoliday]);
                          setNewHoliday('');
                        }}
                        className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center"
                      >
                        <Plus size={18} />
                      </button>
                    </Tooltip>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {settings.holidays.map((hol: string) => (
                      <span key={hol} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 text-xs font-semibold">
                        <span>{hol}</span>
                        <Trash2
                          size={14}
                          onClick={() => handleUpdateSetting('holidays', settings.holidays.filter((h: string) => h !== hol))}
                          className="cursor-pointer hover:text-red-800 dark:hover:text-red-300"
                        />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= 🛡 TAB: WARRANTY (الضمان) ================= */}
            {activeTab === 'warranty' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={22} strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400" />
                    شروط وقوالب الضمان
                  </h2>
                  <Tooltip text="إضافة نموذج ضمان جديد" position="right">
                    <button
                      onClick={handleOpenWarrantyAdd}
                      className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-md shadow-indigo-600/10"
                    >
                      <Plus size={20} />
                    </button>
                  </Tooltip>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(warrantyTemplates || []).map((wt: WarrantyTemplate) => (
                    <div key={wt.id} className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={18} className="text-indigo-600" />
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{wt.name}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          wt.type === 'general'
                            ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                        }`}>
                          {wt.type === 'general' ? 'عام' : 'خدمة محددة'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed text-right h-12">
                        {wt.content.replace(/<[^>]*>/g, '')}
                      </p>
                      <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-900 pt-3">
                        <Tooltip text="قالب نشط" position="above">
                          <input
                            type="checkbox"
                            checked={wt.isActive}
                            onChange={(e) => {
                              updateWarrantyTemplate(wt.id, { isActive: e.target.checked });
                              toast.success('تم تغيير حالة الضمان ✓');
                            }}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </Tooltip>
                        <div className="flex gap-2">
                          <Tooltip text="تعديل قالب الضمان" position="above">
                            <button
                              onClick={() => handleStartEditWarranty(wt)}
                              className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-indigo-600 dark:text-indigo-400"
                            >
                              <Edit2 size={16} strokeWidth={1.5} />
                            </button>
                          </Tooltip>
                          <Tooltip text="حذف قالب الضمان" position="above">
                            <button
                              onClick={() => {
                                if (wt.id === 'w_gen') {
                                  toast.error('لا يمكن حذف نموذج الضمان العام الأساسي');
                                  return;
                                }
                                deleteWarrantyTemplate(wt.id);
                                toast.success('تم حذف قالب الضمان ✓');
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-red-650 dark:text-red-400"
                            >
                              <Trash2 size={16} strokeWidth={1.5} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rich text Warranty Template Modal */}
                {isWarrantyModalOpen && (
                  <Modal isOpen={isWarrantyModalOpen} onClose={() => setIsWarrantyModalOpen(false)} title="إعداد قالب الضمان">
                    <form onSubmit={handleWarrantySubmit} className="space-y-4 font-cairo">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <IconInput
                          icon={FileText}
                          value={warrantyName}
                          onChange={(e) => setWarrantyName(e.target.value)}
                          placeholder="اسم قالب الضمان"
                          tooltip="اسم قالب الضمان"
                        />
                        <IconSelect
                          icon={Tag} // fallback icon tag
                          value={warrantyType}
                          onChange={(e) => setWarrantyType(e.target.value as any)}
                          tooltip="نوع القالب"
                        >
                          <option value="general">عام (لجميع خدمات الفاتورة)</option>
                          <option value="category">تصنيف (مربوط بقسم معين)</option>
                        </IconSelect>
                      </div>

                      {warrantyType === 'category' && (
                        <IconSelect
                          icon={Wrench}
                          value={warrantyCatId}
                          onChange={(e) => setWarrantyCatId(e.target.value)}
                          tooltip="اختر التصنيف المرتبط"
                        >
                          <option value="">-- اختر قسم صيانة --</option>
                          {(serviceCategories || []).map((cat: ServiceCategory) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </IconSelect>
                      )}

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_default_warranty"
                          checked={warrantyIsDefault}
                          onChange={(e) => setWarrantyIsDefault(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-xs text-slate-500">جعل هذا القالب افتراضياً لتصنيف الصيانة الخاص به</span>
                      </div>

                      {/* Content editor */}
                      <RichTextEditor value={warrantyContent} onChange={setWarrantyContent} />

                      <div className="flex gap-2 justify-end pt-3">
                        <Tooltip text="حفظ النموذج" position="above">
                          <button
                            type="submit"
                            className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-750 flex items-center justify-center gap-1.5"
                          >
                            <Check size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip text="إلغاء التغييرات" position="above">
                          <button
                            type="button"
                            onClick={() => setIsWarrantyModalOpen(false)}
                            className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                          >
                            <X size={16} />
                          </button>
                        </Tooltip>
                      </div>
                    </form>
                  </Modal>
                )}
              </div>
            )}

            {/* ================= 🔧 TAB: SERVICES (الخدمات) ================= */}
            {activeTab === 'services' && (
              <ServicesSettingsTab />
            )}

            {/* ================= 💰 TAB: FINANCE (المالية) ================= */}
            {activeTab === 'finance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Coins size={22} strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400" />
                  إعدادات الضرائب والمالية
                </h2>

                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <IconSelect
                      icon={Coins}
                      tooltip="العملة الافتراضية"
                      fieldKey="currency"
                      savedFields={savedFields}
                      value={settings.currency}
                      onChange={(e) => handleUpdateSetting('currency', e.target.value)}
                    >
                      <option value="د.ع">د.ع (دينار عراقي)</option>
                      <option value="$">$ (دولار أمريكي)</option>
                      <option value="€">€ (يورو)</option>
                    </IconSelect>

                    <IconInput
                      icon={Percent} // fallback icon
                      type="number"
                      value={settings.taxRate}
                      onChange={(e) => handleUpdateSetting('taxRate', parseFloat(e.target.value) || 0)}
                      fieldKey="taxRate"
                      savedFields={savedFields}
                      placeholder="نسبة الضريبة الافتراضية %"
                      tooltip="نسبة الضريبة المضافة للفواتير"
                    />

                    <IconInput
                      icon={Calendar}
                      type="number"
                      value={settings.maxDeferredDays}
                      onChange={(e) => handleUpdateSetting('maxDeferredDays', parseInt(e.target.value) || 30)}
                      fieldKey="maxDeferredDays"
                      savedFields={savedFields}
                      placeholder="أقصى أيام للدفع الآجل"
                      tooltip="أقصى مهلة سداد للدين الآجل"
                    />
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400">طرق الدفع المفعلة بالفاتورة</h4>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { key: 'cash', icon: Coins, label: 'نقداً' },
                        { key: 'card', icon: CreditCard, label: 'بطاقة' },
                        { key: 'transfer', icon: ArrowRightLeft, label: 'تحويل بنكي' },
                        { key: 'deferred', icon: Clock, label: 'آجل' }
                      ].map((pm) => {
                        const val = settings.paymentMethods?.[pm.key as keyof typeof settings.paymentMethods] ?? true;
                        return (
                          <Tooltip key={pm.key} text={pm.label} position="above">
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateSetting('paymentMethods', {
                                  ...settings.paymentMethods,
                                  [pm.key]: !val
                                });
                              }}
                              className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                                val
                                  ? 'border-indigo-600 bg-indigo-50/40 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                                  : 'border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-600'
                              }`}
                            >
                              <pm.icon size={22} strokeWidth={1.5} />
                            </button>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 🔔 TAB: REMINDERS (التذكيرات) ================= */}
            {activeTab === 'reminders' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Bell size={22} strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400" />
                  إعدادات رسائل وتنبيهات الواتساب
                </h2>

                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Smartphone size={18} className="text-indigo-600" />
                      <span className="text-xs text-slate-500 font-semibold">إرسال تذكيرات تلقائياً</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoReminders}
                      onChange={(e) => handleUpdateSetting('autoReminders', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <IconInput
                      icon={Clock}
                      type="number"
                      value={settings.reminderTiming?.daysBefore}
                      onChange={(e) =>
                        handleUpdateSetting('reminderTiming', {
                          ...settings.reminderTiming,
                          daysBefore: parseInt(e.target.value) || 7
                        })
                      }
                      fieldKey="daysBefore"
                      savedFields={savedFields}
                      placeholder="وقت التذكير (أيام قبل)"
                      tooltip="إرسال تنبيه قبل الموعد بـ X أيام"
                    />
                    <IconInput
                      icon={Gauge}
                      type="number"
                      value={settings.reminderTiming?.kmBefore}
                      onChange={(e) =>
                        handleUpdateSetting('reminderTiming', {
                          ...settings.reminderTiming,
                          kmBefore: parseInt(e.target.value) || 500
                        })
                      }
                      fieldKey="kmBefore"
                      savedFields={savedFields}
                      placeholder="مسافة التذكير (كم قبل)"
                      tooltip="إرسال تنبيه قبل الموعد بـ X كيلومتر"
                    />
                  </div>

                  {/* Message templates */}
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="relative flex items-start gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Tooltip text="تعديل قالب رسالة عامة" position="right">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <MessageSquareIcon size={18} strokeWidth={1.5} />
                        </div>
                      </Tooltip>
                      <textarea
                        value={settings.whatsappTemplates?.general}
                        onChange={(e) => {
                          handleUpdateSetting('whatsappTemplates', {
                            ...settings.whatsappTemplates,
                            general: e.target.value
                          });
                        }}
                        className="flex-1 min-h-[70px] border-none bg-transparent outline-none text-xs text-slate-800 dark:text-slate-100 text-right font-cairo pr-2 py-1 leading-relaxed"
                        placeholder="قالب رسالة عامة"
                      />
                    </div>

                    <div className="relative flex items-start gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Tooltip text="تعديل قالب رسالة الزيوت" position="right">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Droplet size={18} strokeWidth={1.5} />
                        </div>
                      </Tooltip>
                      <textarea
                        value={settings.whatsappTemplates?.oil}
                        onChange={(e) => {
                          handleUpdateSetting('whatsappTemplates', {
                            ...settings.whatsappTemplates,
                            oil: e.target.value
                          });
                        }}
                        className="flex-1 min-h-[70px] border-none bg-transparent outline-none text-xs text-slate-800 dark:text-slate-100 text-right font-cairo pr-2 py-1 leading-relaxed"
                        placeholder="قالب رسالة الزيوت"
                      />
                    </div>

                    <div className="relative flex items-start gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Tooltip text="تعديل قالب رسالة الفرامل" position="right">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Disc size={18} strokeWidth={1.5} />
                        </div>
                      </Tooltip>
                      <textarea
                        value={settings.whatsappTemplates?.brakes}
                        onChange={(e) => {
                          handleUpdateSetting('whatsappTemplates', {
                            ...settings.whatsappTemplates,
                            brakes: e.target.value
                          });
                        }}
                        className="flex-1 min-h-[70px] border-none bg-transparent outline-none text-xs text-slate-800 dark:text-slate-100 text-right font-cairo pr-2 py-1 leading-relaxed"
                        placeholder="قالب رسالة الفرامل"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 👥 TAB: USERS (المستخدمون) ================= */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Users size={22} strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400" />
                    الموظفون وصلاحيات الأدوار
                  </h2>
                  <Tooltip text="إضافة مستخدم جديد" position="right">
                    <button
                      onClick={handleOpenUserAdd}
                      className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-md shadow-indigo-600/10"
                    >
                      <UserPlus size={20} />
                    </button>
                  </Tooltip>
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                          <th className="py-3 px-4 w-12 text-center">
                            <Tooltip text="الصورة" position="below"><div className="flex justify-center"><User size={16} /></div></Tooltip>
                          </th>
                          <th className="py-3 px-4">
                            <Tooltip text="الاسم" position="below"><div className="flex justify-start"><User size={16} /></div></Tooltip>
                          </th>
                          <th className="py-3 px-4">
                            <Tooltip text="البريد الإلكتروني" position="below"><div className="flex justify-start"><Mail size={16} /></div></Tooltip>
                          </th>
                          <th className="py-3 px-4 w-24 text-center">
                            <Tooltip text="الدور الوظيفي" position="below"><div className="flex justify-center"><Award size={16} /></div></Tooltip>
                          </th>
                          <th className="py-3 px-4 w-20 text-center">
                            <Tooltip text="حالة الموظف" position="below"><div className="flex justify-center"><Power size={16} /></div></Tooltip>
                          </th>
                          <th className="py-3 px-4 w-24 text-center">
                            <Tooltip text="خيارات" position="below"><div className="flex justify-center"><Sliders size={16} /></div></Tooltip>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(users || []).map((usr: UserType) => (
                          <tr key={usr.id} className="border-b border-slate-50 dark:border-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 text-xs text-slate-700 dark:text-slate-350">
                            <td className="py-3 px-4 text-center">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center mx-auto">
                                {usr.name.charAt(0)}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">{usr.name}</td>
                            <td className="py-3 px-4 font-mono">{usr.email}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center">
                                {usr.role === 'admin' && <Crown size={18} className="text-yellow-500" />}
                                {usr.role === 'technician' && <Wrench size={18} className="text-blue-500" />}
                                {usr.role === 'receptionist' && <Headphones size={18} className="text-green-500" />}
                                {usr.role === 'accountant' && <Calculator size={18} className="text-purple-500" />}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={usr.isActive}
                                onChange={(e) => {
                                  updateUser(usr.id, { isActive: e.target.checked });
                                  toast.success('تم تغيير حالة الموظف ✓');
                                }}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center gap-1.5">
                                <Tooltip text="تعديل بيانات المستخدم" position="above">
                                  <button
                                    onClick={() => handleStartEditUser(usr)}
                                    className="p-1 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                </Tooltip>
                                <Tooltip text="حذف المستخدم" position="above">
                                  <button
                                    onClick={() => {
                                      if (usr.id === currentUser?.id) {
                                        toast.error('لا يمكنك حذف حسابك الذي تسجل الدخول به حالياً');
                                        return;
                                      }
                                      deleteUser(usr.id);
                                      toast.success('تم حذف المستخدم بنجاح ✓');
                                    }}
                                    className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-50 dark:border-slate-900 pb-3">
                    <Crown size={18} strokeWidth={1.5} className="text-yellow-500" />
                    مصفوفة صلاحيات الفروع والأدوار
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-center">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                          <th className="py-3 px-4"></th>
                          {[
                            { key: 'view', icon: Eye, label: 'عرض' },
                            { key: 'add', icon: Plus, label: 'إضافة' },
                            { key: 'edit', icon: Edit2, label: 'تعديل' },
                            { key: 'delete', icon: Trash2, label: 'حذف' },
                            { key: 'print', icon: Printer, label: 'طباعة' },
                            { key: 'export', icon: Download, label: 'تصدير' }
                          ].map((col) => (
                            <th key={col.key} className="py-3 px-4">
                              <Tooltip text={col.label} position="below">
                                <div className="flex justify-center">
                                  <col.icon size={16} strokeWidth={1.5} />
                                </div>
                              </Tooltip>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: 'admin', icon: Crown, label: 'المدير' },
                          { key: 'receptionist', icon: Headphones, label: 'الاستقبال' },
                          { key: 'technician', icon: Wrench, label: 'الفني' },
                          { key: 'accountant', icon: Calculator, label: 'المحاسب' }
                        ].map((role) => (
                          <tr key={role.key} className="border-b border-slate-50 dark:border-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 text-xs">
                            <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-350">
                              <Tooltip text={role.label} position="right">
                                <div className="flex justify-center items-center">
                                  <role.icon size={16} className="text-slate-500" />
                                </div>
                              </Tooltip>
                            </td>
                            {['view', 'add', 'edit', 'delete', 'print', 'export'].map((act) => {
                              const checked = permissionsMatrix?.[role.key as UserRole]?.general?.[act as keyof typeof permissionsMatrix[UserRole]['general']] ?? false;
                              return (
                                <td key={act} className="py-3 px-4">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleTogglePermission(role.key as UserRole, 'general', act)}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add/Edit User Modal */}
                {isUserModalOpen && (
                  <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="إعداد حساب الموظف">
                    <form onSubmit={handleUserSubmit} className="space-y-4 font-cairo">
                      <IconInput
                        icon={User}
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="الاسم الكامل"
                        tooltip="الاسم الكامل للموظف"
                      />
                      <IconInput
                        icon={Mail}
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="البريد الإلكتروني"
                        tooltip="البريد الإلكتروني للموظف"
                      />
                      <IconInput
                        icon={Lock}
                        type="password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder={editingUser ? 'كلمة مرور جديدة (اتركها فارغة لعدم التعديل)' : 'كلمة المرور'}
                        tooltip="كلمة المرور الخاصة بالمستخدم"
                      />
                      <IconSelect
                        icon={Crown}
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value as UserRole)}
                        tooltip="الدور الوظيفي وصلاحياته"
                      >
                        <option value="admin">مدير النظام (Admin)</option>
                        <option value="receptionist">موظف استقبال (Receptionist)</option>
                        <option value="technician">فني صيانة (Technician)</option>
                        <option value="accountant">محاسب (Accountant)</option>
                      </IconSelect>

                      <div className="flex gap-2 justify-end pt-3">
                        <Tooltip text="حفظ بيانات الموظف" position="above">
                          <button
                            type="submit"
                            className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-750 flex items-center justify-center"
                          >
                            <Check size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip text="تراجع وإلغاء" position="above">
                          <button
                            type="button"
                            onClick={() => setIsUserModalOpen(false)}
                            className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                          >
                            <X size={16} />
                          </button>
                        </Tooltip>
                      </div>
                    </form>
                  </Modal>
                )}
              </div>
            )}

            {/* ================= 🖨 TAB: PRINT (الطباعة) ================= */}
            {activeTab === 'print' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Printer size={22} strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400" />
                  إعدادات الطباعة وهوامش الصفحات
                </h2>

                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <IconSelect
                      icon={FileText}
                      tooltip="حجم الورقة الافتراضية"
                      fieldKey="defaultPaperSize"
                      savedFields={savedFields}
                      value={settings.defaultPaperSize}
                      onChange={(e) => handleUpdateSetting('defaultPaperSize', e.target.value)}
                    >
                      <option value="A4">A4 (الافتراضي)</option>
                      <option value="A5">A5 (نصف الصفحة)</option>
                      <option value="Letter">Letter</option>
                    </IconSelect>

                    <IconInput
                      icon={Copy}
                      type="number"
                      value={settings.defaultPrintCopies}
                      onChange={(e) => handleUpdateSetting('defaultPrintCopies', parseInt(e.target.value) || 1)}
                      fieldKey="defaultPrintCopies"
                      savedFields={savedFields}
                      placeholder="عدد النسخ الافتراضية"
                      tooltip="عدد النسخ المطبوعة تلقائياً"
                    />
                  </div>

                  {/* Margins slider */}
                  <div className="space-y-2 border-t border-slate-150 dark:border-slate-800/80 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal size={18} className="text-indigo-600" />
                        <span className="text-xs text-slate-500 font-semibold">هوامش صفحة الطباعة (مم)</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{settings.printMargins} مم</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      value={settings.printMargins}
                      onChange={(e) => handleUpdateSetting('printMargins', parseInt(e.target.value) || 0)}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-150 dark:border-slate-800/80 pt-4">
                    <div className="flex items-center gap-2">
                      <Printer size={18} className="text-indigo-600" />
                      <span className="text-xs text-slate-500 font-semibold">طباعة الفاتورة تلقائياً عند إنهاء الزيارة</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoPrintOnComplete}
                      onChange={(e) => handleUpdateSetting('autoPrintOnComplete', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= 🔧 TAB: INSPECTION TEMPLATES (قوائم الفحص) ================= */}
            {activeTab === 'inspections' && (
              <div className="space-y-6 max-w-4xl" dir="rtl">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ClipboardList size={22} strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400" />
                    تخصيص قوائم الفحص الفني
                  </h2>
                  <button
                    onClick={() => {
                      if (confirm('هل تريد إعادة تعيين قائمة الفحص إلى الإعدادات الافتراضية؟ سيتم حذف كل التعديلات.')) {
                        resetTemplateToDefault();
                        toast.success('تم إعادة القائمة إلى الإعدادات الافتراضية');
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 rounded-xl px-3 py-1.5 hover:bg-amber-100 transition-all"
                  >
                    <RefreshCw size={14} />
                    إعادة الضبط الافتراضي
                  </button>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  يمكنك إضافة أو حذف أقسام الفحص (مثل قياس البطارية، فحص الجهاز) وإدارة بنود كل قسم.
                  ستنطبق هذه التغييرات على جميع الفحوصات الجديدة التي سيتم إنشاؤها.
                </p>

                {/* ─── Add New Section ─── */}
                <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Plus size={16} className="text-indigo-600" />
                    إضافة قسم جديد
                  </h3>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[180px] space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">اسم القسم (عربي)</label>
                      <input
                        type="text"
                        value={insp_newSectionName}
                        onChange={e => setInsp_newSectionName(e.target.value)}
                        placeholder="مثال: فحص عبوة البطارية"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right font-cairo"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">الأيقونة</label>
                      <select
                        value={insp_newSectionIcon}
                        onChange={e => setInsp_newSectionIcon(e.target.value)}
                        className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      >
                        {AVAILABLE_ICONS.map(icon => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">اللون</label>
                      <input
                        type="color"
                        value={insp_newSectionColor}
                        onChange={e => setInsp_newSectionColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!insp_newSectionName.trim()) { toast.error('يرجى إدخال اسم القسم'); return; }
                        addTemplateSection(insp_newSectionName.trim(), insp_newSectionIcon, insp_newSectionColor);
                        setInsp_newSectionName('');
                        toast.success(`تم إضافة قسم "${insp_newSectionName.trim()}"`);
                      }}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-all shadow-lg shadow-indigo-600/10"
                    >
                      <Plus size={16} />
                      إضافة
                    </button>
                  </div>
                </div>

                {/* ─── Sections List ─── */}
                <div className="space-y-3">
                  {inspectionTemplate.map((sec: TemplateSection) => (
                    <div
                      key={sec.id}
                      className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      {/* Section header */}
                      <div
                        className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                        onClick={() => setInsp_expandedSection(insp_expandedSection === sec.id ? null : sec.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${sec.color}18`, border: `1.5px solid ${sec.color}40` }}
                          >
                            <span style={{ color: sec.color, fontSize: '18px' }}>⬛</span>
                          </div>
                          {insp_editSectionId === sec.id ? (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <input
                                value={insp_editSectionName}
                                onChange={e => setInsp_editSectionName(e.target.value)}
                                className="px-2.5 py-1.5 border border-indigo-400 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-cairo"
                                autoFocus
                              />
                              <select
                                value={insp_editSectionIcon}
                                onChange={e => setInsp_editSectionIcon(e.target.value)}
                                className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm font-mono focus:outline-none"
                              >
                                {AVAILABLE_ICONS.map(icon => (
                                  <option key={icon} value={icon}>{icon}</option>
                                ))}
                              </select>
                              <input
                                type="color"
                                value={insp_editSectionColor}
                                onChange={e => setInsp_editSectionColor(e.target.value)}
                                className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                              />
                              <button
                                onClick={() => {
                                  updateTemplateSection(sec.id, { name: insp_editSectionName, icon: insp_editSectionIcon, color: insp_editSectionColor });
                                  setInsp_editSectionId(null);
                                  toast.success('تم تحديث القسم');
                                }}
                                className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setInsp_editSectionId(null)}
                                className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{sec.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{sec.items.length} بند</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setInsp_editSectionId(sec.id);
                              setInsp_editSectionName(sec.name);
                              setInsp_editSectionIcon(sec.icon);
                              setInsp_editSectionColor(sec.color);
                            }}
                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-colors"
                            title="تعديل القسم"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل تريد حذف قسم "${sec.name}"؟`)) {
                                deleteTemplateSection(sec.id);
                                toast.success('تم حذف القسم');
                              }
                            }}
                            className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                            title="حذف القسم"
                          >
                            <Trash2 size={14} />
                          </button>
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 transition-transform duration-200 ${insp_expandedSection === sec.id ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </div>

                      {/* Expanded items */}
                      {insp_expandedSection === sec.id && (
                        <div className="border-t border-slate-100 dark:border-slate-800">
                          {/* Existing items */}
                          {sec.items.length > 0 ? (
                            <div className="divide-y divide-slate-50 dark:divide-slate-900">
                              {sec.items.map(item => (
                                <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-900/20">
                                  {insp_editItemId === item.id ? (
                                    <div className="flex flex-1 items-center gap-2 flex-wrap">
                                      <input
                                        value={insp_editItemName}
                                        onChange={e => setInsp_editItemName(e.target.value)}
                                        placeholder="اسم البند (عربي)"
                                        className="flex-1 min-w-[120px] px-2.5 py-1.5 border border-indigo-400 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none font-cairo"
                                      />
                                      <input
                                        value={insp_editItemNameEn}
                                        onChange={e => setInsp_editItemNameEn(e.target.value)}
                                        placeholder="Name (English)"
                                        className="flex-1 min-w-[120px] px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none font-mono"
                                      />
                                      <button
                                        onClick={() => {
                                          updateTemplateItem(sec.id, item.id, insp_editItemName, insp_editItemNameEn);
                                          setInsp_editItemId(null);
                                          toast.success('تم تحديث البند');
                                        }}
                                        className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shrink-0"
                                      >
                                        <Check size={13} />
                                      </button>
                                      <button
                                        onClick={() => setInsp_editItemId(null)}
                                        className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg shrink-0"
                                      >
                                        <X size={13} />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex-1">
                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">{item.nameEn}</p>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={() => {
                                            setInsp_editItemId(item.id);
                                            setInsp_editItemName(item.name);
                                            setInsp_editItemNameEn(item.nameEn);
                                          }}
                                          className="p-1.5 text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-colors"
                                        >
                                          <Edit2 size={12} />
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (confirm(`حذف البند "${item.name}"؟`)) {
                                              deleteTemplateItem(sec.id, item.id);
                                              toast.success('تم حذف البند');
                                            }
                                          }}
                                          className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-5 py-4 text-[11px] text-slate-400 text-center">
                              لا توجد بنود في هذا القسم. أضف بنداً أدناه.
                            </div>
                          )}

                          {/* Add new item */}
                          <div className="flex flex-wrap gap-2 items-center p-4 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800/60">
                            <input
                              type="text"
                              value={insp_newItemName[sec.id] || ''}
                              onChange={e => setInsp_newItemName(prev => ({ ...prev, [sec.id]: e.target.value }))}
                              placeholder="اسم البند (عربي)"
                              className="flex-1 min-w-[140px] px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-cairo"
                            />
                            <input
                              type="text"
                              value={insp_newItemNameEn[sec.id] || ''}
                              onChange={e => setInsp_newItemNameEn(prev => ({ ...prev, [sec.id]: e.target.value }))}
                              placeholder="Field Name (English)"
                              className="flex-1 min-w-[140px] px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                            />
                            <button
                              onClick={() => {
                                const name = insp_newItemName[sec.id]?.trim();
                                if (!name) { toast.error('يرجى إدخال اسم البند'); return; }
                                addTemplateItem(sec.id, name, insp_newItemNameEn[sec.id]?.trim() || name);
                                setInsp_newItemName(prev => ({ ...prev, [sec.id]: '' }));
                                setInsp_newItemNameEn(prev => ({ ...prev, [sec.id]: '' }));
                                toast.success(`تم إضافة البند: ${name}`);
                              }}
                              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0"
                            >
                              <Plus size={13} />
                              إضافة بند
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {inspectionTemplate.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-semibold">لا توجد أقسام في القائمة</p>
                      <p className="text-xs mt-1">أضف قسماً جديداً أعلاه أو أعد الضبط الافتراضي</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= 💾 TAB: DATABASE (البيانات) ================= */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Database size={22} strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400" />
                  إدارة البيانات والنسخ الاحتياطي
                </h2>

                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
                  {/* Import file input hidden */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".json"
                    onChange={(e) => handleImportJSONFile(e.target.files?.[0])}
                  />

                  {/* Buttons with short text, centered */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-cairo">
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="py-3 px-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-all text-xs font-bold"
                    >
                      <Download size={18} strokeWidth={1.5} />
                      تصدير JSON
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="py-3 px-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all text-xs font-bold"
                    >
                      <FileSpreadsheet size={18} strokeWidth={1.5} />
                      تصدير Excel
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-3 px-4 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all text-xs font-bold"
                    >
                      <Upload size={18} strokeWidth={1.5} />
                      استيراد نسخة
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowStats(!showStats)}
                      className="py-3 px-4 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all text-xs font-bold"
                    >
                      <Info size={18} strokeWidth={1.5} />
                      إحصائيات قاعدة البيانات
                    </button>
                  </div>

                  {/* Red wipe database button */}
                  <div className="border-t border-slate-150 dark:border-slate-850 pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="py-3 px-6 bg-red-650 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-650/15 text-xs font-bold"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                      مسح جميع البيانات
                    </button>
                  </div>
                </div>

                {/* DB Stats card (visible when active) */}
                {showStats && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4"
                  >
                    {[
                      { icon: Users, label: 'عدد العملاء', value: customersCount },
                      { icon: Wrench, label: 'عدد السيارات', value: carsCount }, // fallback icon for vehicle
                      { icon: FileText, label: 'عدد الزيارات', value: visitsCount }, // fallback icon for visits
                      { icon: Receipt, label: 'عدد الفواتير', value: invoicesCount },
                      { icon: Database, label: 'حجم البيانات', value: `${dataSizeKB} KB` }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-850 flex flex-col items-center justify-center text-center gap-2">
                        <stat.icon size={20} className="text-indigo-650 dark:text-indigo-400" />
                        <span className="text-[10px] text-slate-400 font-bold">{stat.label}</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-mono">{stat.value}</span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Activity Log Viewer */}
                <ActivityLogViewer />
              </div>
            )}
          </div>
        )}
      </SettingsErrorBoundary>
      </div>

      {/* Confirmation Wipe all database Modal */}
      {isDeleteConfirmOpen && (
        <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="تأكيد حذف البيانات">
          <div className="space-y-4 text-center font-cairo p-2">
            <div className="w-12 h-12 rounded-full bg-red-105 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Database size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">تحذير أمان: حذف كامل قاعدة البيانات!</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              أنت على وشك مسح جميع العملاء، السيارات، الزيارات، والفواتير المسجلة نهائياً من هذا الجهاز. لا يمكن التراجع عن هذه الخطوة إلا إذا قمت بتصدير نسخة احتياطية مسبقاً.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={handleWipeAllData}
                className="px-5 py-2 rounded-lg bg-red-650 hover:bg-red-700 text-white text-xs font-bold"
              >
                تأكيد المسح النهائي
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
              >
                إلغاء وتراجع
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==================== Rebuilt Services Settings Components ====================

interface AddCategoryModalProps {
  category?: ServiceCategory | null;
  onClose: () => void;
  onAdd: (cat: any) => void;
  onUpdate: (id: string, updates: any) => void;
}

function AddCategoryModal({ category, onClose, onAdd, onUpdate }: AddCategoryModalProps) {
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || 'Wrench');
  const [color, setColor] = useState(category?.color || '#6366F1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('يرجى كتابة اسم التصنيف');
      return;
    }
    if (category) {
      onUpdate(category.id, { name, icon, color });
      toast.success('تمت تحديث التصنيف بنجاح ✓');
    } else {
      onAdd({
        name,
        nameEn: name,
        icon,
        color,
        sortOrder: 10,
        isActive: true,
        subcategories: []
      });
      toast.success('تمت إضافة التصنيف بنجاح ✓');
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={category ? 'تعديل التصنيف' : 'تصنيف جديد'}>
      <form onSubmit={handleSubmit} className="space-y-4 font-cairo text-right" dir="rtl">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-400">اسم التصنيف بالعربية</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right"
            placeholder="مثال: زيوت المحركات"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">أيقونة التصنيف</label>
            <div className="flex justify-end">
              <IconPicker selectedIcon={icon} onChange={setIcon} tooltip="اختر أيقونة" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">لون التصنيف</label>
            <div className="flex justify-end">
              <ColorField color={color} onChange={setColor} tooltip="اختر لوناً" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold"
          >
            {category ? 'تحديث' : 'إضافة'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-150 dark:bg-slate-800 text-slate-705 dark:text-slate-350 hover:bg-slate-200 text-xs font-semibold"
          >
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface AddServiceModalProps {
  categoryId: string;
  categories: ServiceCategory[];
  service?: Service | null;
  onClose: () => void;
  onAdd: (srv: any) => void;
  onUpdate: (id: string, updates: any) => void;
}

function AddServiceModal({ categoryId, categories, service, onClose, onAdd, onUpdate }: AddServiceModalProps) {
  const [name, setName] = useState(service?.name || '');
  const [code, setCode] = useState(service?.code || '');
  const [selectedCatId, setSelectedCatId] = useState(service?.categoryId || categoryId);
  const [subcategoryId, setSubcategoryId] = useState(service?.subcategoryId || '');
  const [description, setDescription] = useState(service?.description || '');
  const [pricingModel, setPricingModel] = useState<'fixed' | 'per_unit' | 'custom'>(service?.pricingModel || 'fixed');
  const [defaultPrice, setDefaultPrice] = useState(service?.defaultPrice || 0);
  const [unit, setUnit] = useState(service?.unit || 'لتر');
  const [isActive, setIsActive] = useState(service ? service.isActive : true);

  // Link fields
  const [reqBrand, setReqBrand] = useState(service ? service.requiresBrand : false);
  const [reqViscosity, setReqViscosity] = useState(service ? service.requiresViscosity : false);
  const [reqLiters, setReqLiters] = useState(service ? service.requiresLiters : false);
  const [reqNextOdometer, setReqNextOdometer] = useState(service ? service.requiresNextOdometer : false);
  const [reqNextDate, setReqNextDate] = useState(service ? service.requiresNextDate : false);
  const [reqFlushType, setReqFlushType] = useState(service ? service.requiresFlushType : false);
  const [reqDOT, setReqDOT] = useState(service ? service.requiresDOT : false);
  const [reqAxle, setReqAxle] = useState(service ? service.requiresAxle : false);

  const [defaultIntervalKm, setDefaultIntervalKm] = useState(service?.defaultIntervalKm || 5000);
  const [defaultIntervalDays, setDefaultIntervalDays] = useState(service?.defaultIntervalDays || 90);

  const selectedCategory = categories.find(c => c.id === selectedCatId);
  const subcategories = selectedCategory?.subcategories || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم الخدمة');
      return;
    }
    const finalCode = code.trim() || `SRV-${crypto.randomUUID().substring(0, 4).toUpperCase()}`;
    const sData = {
      categoryId: selectedCatId,
      subcategoryId: subcategoryId || null,
      name,
      code: finalCode,
      description,
      pricingModel,
      defaultPrice: Number(defaultPrice),
      unit,
      isActive,
      requiresBrand: reqBrand,
      requiresViscosity: reqViscosity,
      requiresLiters: reqLiters,
      requiresNextOdometer: reqNextOdometer,
      requiresNextDate: reqNextDate,
      requiresFlushType: reqFlushType,
      requiresDOT: reqDOT,
      requiresAxle: reqAxle,
      viscosityOptions: service?.viscosityOptions || ['0W-20','5W-30','5W-40','10W-40','15W-40','20W-50'],
      brands: service?.brands || ['Castrol','Mobil 1','Shell','Total','Liqui Moly','Valvoline','Motul'],
      defaultIntervalKm: Number(defaultIntervalKm),
      defaultIntervalDays: Number(defaultIntervalDays),
    };

    if (service) {
      onUpdate(service.id, sData);
      toast.success('تمت تحديث الخدمة بنجاح ✓');
    } else {
      onAdd(sData);
      toast.success('تمت إضافة الخدمة بنجاح ✓');
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={service ? 'تعديل الخدمة' : 'خدمة جديدة'}>
      <form onSubmit={handleSubmit} className="space-y-4 font-cairo text-right" dir="rtl">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">اسم الخدمة بالعربية</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right"
              placeholder="مثال: تغيير زيت محرك 5000 كم"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">كود الخدمة</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right"
              placeholder="مثال: SRV-001"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">التصنيف الرئيسي</label>
            <select
              value={selectedCatId}
              onChange={(e) => {
                setSelectedCatId(e.target.value);
                setSubcategoryId('');
              }}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right font-cairo"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">التصنيف الفرعي</label>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              disabled={subcategories.length === 0}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right font-cairo disabled:opacity-55"
            >
              <option value="">-- بدون تصنيف فرعي --</option>
              {subcategories.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">طريقة التسعير</label>
            <select
              value={pricingModel}
              onChange={(e) => setPricingModel(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right font-cairo"
            >
              <option value="fixed">سعر ثابت</option>
              <option value="per_unit">لكل وحدة (لتر/قطعة)</option>
              <option value="custom">مخصص / حر</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">السعر الافتراضي (د.ع)</label>
            <input
              type="number"
              value={defaultPrice}
              onChange={(e) => setDefaultPrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">وحدة القياس</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right"
              placeholder="مثال: لتر، قطعة"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">دورة الصيانة القادمة (كم)</label>
            <input
              type="number"
              value={defaultIntervalKm}
              onChange={(e) => setDefaultIntervalKm(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">دورة الصيانة القادمة (أيام)</label>
            <input
              type="number"
              value={defaultIntervalDays}
              onChange={(e) => setDefaultIntervalDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right"
            />
          </div>
        </div>

        {/* Linked fields checkboxes grid */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
          <h4 className="text-xs font-bold text-slate-400">الحقول المطلوبة في كرت الزيارة</h4>
          <div className="grid grid-cols-4 gap-2">
            {[
              { state: reqBrand, setter: setReqBrand, label: 'الماركة' },
              { state: reqViscosity, setter: setReqViscosity, label: 'اللزوجة' },
              { state: reqLiters, setter: setReqLiters, label: 'عدد اللترات' },
              { state: reqNextOdometer, setter: setReqNextOdometer, label: 'عداد الصيانة القادم' },
              { state: reqNextDate, setter: setReqNextDate, label: 'تاريخ الصيانة القادم' },
              { state: reqFlushType, setter: setReqFlushType, label: 'نوع التغيير / الغسيل' },
              { state: reqDOT, setter: setReqDOT, label: 'درجة DOT' },
              { state: reqAxle, setter: setReqAxle, label: 'المحور (أمامي/خلفي)' }
            ].map((fld, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => fld.setter(!fld.state)}
                className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                  fld.state
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 dark:text-slate-500'
                }`}
              >
                {fld.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold"
          >
            {service ? 'تحديث' : 'إضافة'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-150 dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-200 text-xs font-semibold"
          >
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ServicesSettingsTab() {
  const categories = useServiceStore((s: any) => s.categories) || [];
  const services = useServiceStore((s: any) => s.services) || [];
  const addCategory = useServiceStore((s: any) => s.addCategory);
  const updateCategory = useServiceStore((s: any) => s.updateCategory);
  const deleteCategory = useServiceStore((s: any) => s.deleteCategory);
  const addSubcategory = useServiceStore((s: any) => s.addSubcategory);
  const deleteSubcategory = useServiceStore((s: any) => s.deleteSubcategory);
  const addService = useServiceStore((s: any) => s.addService);
  const updateService = useServiceStore((s: any) => s.updateService);
  const deleteService = useServiceStore((s: any) => s.deleteService);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [showAddService, setShowAddService] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [newSubcatName, setNewSubcatName] = useState<Record<string, string>>({});

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const filteredServices = services.filter((s: Service) => s.categoryId === selectedCategoryId);
  const selectedCategory = categories.find((c: ServiceCategory) => c.id === selectedCategoryId);

  return (
    <div className="space-y-6 text-right font-cairo" dir="rtl">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Wrench size={22} strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400" />
          إدارة دليل وتصنيفات الخدمات
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingCategory(null);
              setShowAddCategory(true);
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 text-xs font-semibold transition-all"
          >
            <FolderPlus size={16} />
            تصنيف جديد
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedCategoryId) {
                toast.error('اختر تصنيفاً أولاً');
                return;
              }
              setEditingService(null);
              setShowAddService(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 text-xs font-semibold shadow-md shadow-indigo-600/10 transition-all"
          >
            <Plus size={16} />
            خدمة جديدة
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* CATEGORIES SIDEBAR */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 mb-2">التصنيفات الرئيسية</h3>
          {categories
            .filter((c: ServiceCategory) => c.isActive)
            .sort((a: ServiceCategory, b: ServiceCategory) => a.sortOrder - b.sortOrder)
            .map((cat: ServiceCategory) => {
              const isSelected = selectedCategoryId === cat.id;
              const isExpanded = !!expandedCategories[cat.id];
              return (
                <div key={cat.id} className="space-y-1">
                  <div
                    className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold border-r-4 border-indigo-605'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350'
                    }`}
                    onClick={() => setSelectedCategoryId(cat.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color || '#6366F1' }}
                      />
                      <span className="text-xs font-semibold">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCategories((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }));
                        }}
                        className="p-1 hover:text-indigo-600 text-slate-400"
                        title="عرض التصنيفات الفرعية"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(cat);
                          setShowAddCategory(true);
                        }}
                        className="p-1 hover:text-indigo-600 text-slate-400"
                        title="تعديل التصنيف"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (cat.id === 'cat-oil' || cat.id === 'cat-filter') {
                            toast.error('هذا التصنيف أساسي للنظام ولا يمكن حذفه');
                            return;
                          }
                          if (confirm('هل أنت متأكد من حذف هذا التصنيف وجميع خدماته؟')) {
                            deleteCategory(cat.id);
                            toast.success('تم حذف التصنيف بنجاح ✓');
                          }
                        }}
                        className="p-1 hover:text-red-650 text-slate-400"
                        title="حذف التصنيف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Expanded Panel */}
                  {isExpanded && (
                    <div className="mr-3 pr-2.5 border-r border-slate-100 dark:border-slate-800 space-y-2 py-1 bg-slate-50/50 dark:bg-slate-900/40 rounded-lg p-2">
                      <div className="space-y-1.5">
                        {(cat.subcategories || []).map((subcat: Subcategory) => (
                          <div
                            key={subcat.id}
                            className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-100 dark:border-slate-850"
                          >
                            <span>{subcat.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteSubcategory(cat.id, subcat.id);
                                toast.success('تم حذف التصنيف الفرعي ✓');
                              }}
                              className="text-red-500 hover:text-red-750 transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add subcat form */}
                      <div className="flex gap-1.5 mt-2">
                        <input
                          type="text"
                          placeholder="فرعي جديد..."
                          value={newSubcatName[cat.id] || ''}
                          onChange={(e) =>
                            setNewSubcatName((prev) => ({ ...prev, [cat.id]: e.target.value }))
                          }
                          className="flex-1 px-2 py-1 text-[10px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none text-right font-cairo"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = newSubcatName[cat.id];
                            if (!val || !val.trim()) return;
                            addSubcategory(cat.id, {
                              name: val.trim(),
                              sortOrder: (cat.subcategories || []).length + 1,
                              isActive: true,
                            });
                            setNewSubcatName((prev) => ({ ...prev, [cat.id]: '' }));
                            toast.success('تمت إضافة التصنيف الفرعي ✓');
                          }}
                          className="px-2 py-1 rounded bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* SERVICES TABLE LIST */}
        <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
          {filteredServices.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Wrench size={40} className="mx-auto mb-3 opacity-25" />
              <p className="text-xs">لا توجد خدمات مضافة في هذا التصنيف بعد.</p>
              <button
                type="button"
                onClick={() => {
                  setEditingService(null);
                  setShowAddService(true);
                }}
                className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                إضافة أول خدمة
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-bold">
                    <th className="py-3 px-4">كود</th>
                    <th className="py-3 px-4">الخدمة</th>
                    <th className="py-3 px-4">السعر الافتراضي</th>
                    <th className="py-3 px-4">الوحدة</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs">
                  {filteredServices.map((srv: Service) => (
                    <tr
                      key={srv.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 text-slate-700 dark:text-slate-350"
                    >
                      <td className="py-3 px-4 font-mono font-bold">{srv.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        {srv.name}
                        {srv.description && (
                          <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                            {srv.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {srv.defaultPrice.toLocaleString('ar-IQ')} د.ع
                      </td>
                      <td className="py-3 px-4">{srv.unit}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            srv.isActive
                              ? 'bg-green-50 dark:bg-green-950/20 text-green-600'
                              : 'bg-red-50 dark:bg-red-950/20 text-red-650'
                          }`}
                        >
                          {srv.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left">
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => updateService(srv.id, { isActive: !srv.isActive })}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                            title={srv.isActive ? 'تعطيل الخدمة' : 'تفعيل الخدمة'}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingService(srv);
                              setShowAddService(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                            title="تعديل الخدمة"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذه الخدمة نهائياً من الكتالوج؟')) {
                                deleteService(srv.id);
                                toast.success('تمت إزالة الخدمة من الكتالوج ✓');
                              }
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-red-650 transition-colors"
                            title="حذف الخدمة"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ADD/EDIT CATEGORY MODAL */}
      {showAddCategory && (
        <AddCategoryModal
          category={editingCategory}
          onClose={() => setShowAddCategory(false)}
          onAdd={(catData) => {
            addCategory(catData);
            setShowAddCategory(false);
          }}
          onUpdate={(id, updates) => {
            updateCategory(id, updates);
            setShowAddCategory(false);
          }}
        />
      )}

      {/* ADD/EDIT SERVICE MODAL */}
      {showAddService && (
        <AddServiceModal
          categoryId={selectedCategoryId}
          categories={categories}
          service={editingService}
          onClose={() => setShowAddService(false)}
          onAdd={(srvData) => {
            addService(srvData);
            setShowAddService(false);
          }}
          onUpdate={(id, updates) => {
            updateService(id, updates);
            setShowAddService(false);
          }}
        />
      )}
    </div>
  );
}

// Simple wrapper component to use message templates
const MessageSquareIcon = ({ size, strokeWidth }: { size: number; strokeWidth?: number }) => {
  return <MessageSquare size={size} strokeWidth={strokeWidth || 1.5} />;
};

function ActivityLogViewer() {
  const logs = useStore((s) => s.logs) || [];
  const clearLogs = useStore((s) => s.clearLogs);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = logs.filter((l: any) => {
    const matchesSearch = 
      (l.user || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.details || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.action || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = filterAction === 'all' || l.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LOGOUT':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'CLOSE_VISIT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'UNLOCK_VISIT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELETE_VISIT':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع سجلات النشاطات نهائياً؟')) {
      clearLogs();
      toast.success('تم مسح سجل النشاطات بنجاح');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4 font-cairo text-right mt-6">
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Activity size={20} className="text-indigo-650 dark:text-indigo-400" />
          سجل النشاطات والحركات (Activity Log)
        </h3>
        {currentUser?.role === 'admin' && logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="text-xs text-red-600 hover:text-red-700 font-bold border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-xl transition-all"
          >
            مسح السجلات
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث في السجلات (المستخدم، التفاصيل، الحدث)..."
          className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none"
        />
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-brand-bg-dark text-brand-text-light dark:text-brand-text-dark focus:outline-none"
        >
          <option value="all">كل الأحداث</option>
          <option value="LOGIN">تسجيل الدخول</option>
          <option value="LOGOUT">تسجيل الخروج</option>
          <option value="CLOSE_VISIT">إغلاق زيارة</option>
          <option value="UNLOCK_VISIT">فك قفل زيارة</option>
          <option value="DELETE_VISIT">حذف زيارة</option>
        </select>
      </div>

      <div className="overflow-x-auto max-h-[400px] border border-slate-100 dark:border-slate-800 rounded-xl">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">الوقت</th>
              <th className="py-2.5 px-4">المستخدم</th>
              <th className="py-2.5 px-4 text-center">الحدث</th>
              <th className="py-2.5 px-4">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-brand-muted-light font-bold">
                  لا توجد سجلات نشاطات مطابقة للبحث.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log: any) => (
                <tr key={log.id} className="border-b border-slate-50 dark:border-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 text-xs text-slate-700 dark:text-slate-300">
                  <td className="py-2.5 px-4 text-[10px] font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleString('ar-IQ')}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {log.user}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[11px] leading-relaxed max-w-[250px] truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Settings;
