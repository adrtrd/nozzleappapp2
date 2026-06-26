import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type InspectionItemStatus = 'good' | 'attention' | 'replace' | 'na';

export interface InspectionAttachment {
  id: string;
  name: string;
  fileData: string;   // base64
  fileType: string;   // mime type  e.g. 'image/png', 'application/pdf'
  uploadedAt: string; // ISO
}

export interface InspectionItem {
  id:       string;
  name:     string;
  nameEn:   string;
  status:   InspectionItemStatus;
  notes:    string;
  images:   string[];   // base64 photos
}

export interface InspectionSection {
  id:       string;
  name:     string;
  icon:     string;     // Lucide icon name
  color:    string;     // hex
  items:    InspectionItem[];
}

// Template section type — items don't have status/notes/images yet
export interface TemplateSectionItem {
  id:     string;
  name:   string;
  nameEn: string;
}

export interface TemplateSection {
  id:    string;
  name:  string;
  icon:  string;
  color: string;
  items: TemplateSectionItem[];
}

export interface VehicleInspection {
  id:            string;
  carId:         string;
  customerId:    string;
  inspectorName: string;
  date:          string;    // ISO
  odometer:      number;
  reportNumber:  string;    // INS-0001
  overallStatus: 'good' | 'attention' | 'poor';
  sections:      InspectionSection[];
  generalNotes:  string;
  recommendations: string;
  nextInspectionDate: string;
  nextInspectionKm:   number;
  customerSignature:  boolean;
  isLocked:      boolean;
  createdAt:     string;
  attachments:   InspectionAttachment[];
}

export const DEFAULT_INSPECTION_SECTIONS: TemplateSection[] = [
  {
    id: 'sec-engine',
    name: 'المحرك وحجرته',
    icon: 'Cog',
    color: '#EF4444',
    items: [
      { id:'eng-01', name:'مستوى زيت المحرك', nameEn:'Engine Oil Level' },
      { id:'eng-02', name:'حالة زيت المحرك', nameEn:'Engine Oil Condition' },
      { id:'eng-03', name:'مستوى سائل التبريد', nameEn:'Coolant Level' },
      { id:'eng-04', name:'حالة سائل التبريد', nameEn:'Coolant Condition' },
      { id:'eng-05', name:'مستوى زيت الستيرنج', nameEn:'Power Steering Fluid' },
      { id:'eng-06', name:'مستوى سائل البريك', nameEn:'Brake Fluid Level' },
      { id:'eng-07', name:'سير التوزيع / الحزام', nameEn:'Timing Belt/Chain' },
      { id:'eng-08', name:'سير المروحة', nameEn:'Fan Belt' },
      { id:'eng-09', name:'الخراطيم والأنابيب', nameEn:'Hoses & Pipes' },
      { id:'eng-10', name:'تسريب الزيت', nameEn:'Oil Leaks' },
      { id:'eng-11', name:'تسريب سائل التبريد', nameEn:'Coolant Leaks' },
      { id:'eng-12', name:'فلتر الهواء', nameEn:'Air Filter' },
      { id:'eng-13', name:'البطارية', nameEn:'Battery' },
    ],
  },
  {
    id: 'sec-transmission',
    name: 'ناقل الحركة والقير',
    icon: 'Settings2',
    color: '#F59E0B',
    items: [
      { id:'tr-01', name:'مستوى زيت القير', nameEn:'Transmission Fluid Level' },
      { id:'tr-02', name:'حالة زيت القير', nameEn:'Transmission Fluid Condition' },
      { id:'tr-03', name:'زيت الدفرنس الأمامي', nameEn:'Front Differential Oil' },
      { id:'tr-04', name:'زيت الدفرنس الخلفي', nameEn:'Rear Differential Oil' },
      { id:'tr-05', name:'تسريب ناقل الحركة', nameEn:'Transmission Leaks' },
      { id:'tr-06', name:'أداء تغيير السرعات', nameEn:'Gear Shifting Performance' },
    ],
  },
  {
    id: 'sec-brakes',
    name: 'منظومة الفرامل',
    icon: 'CircleDot',
    color: '#DC2626',
    items: [
      { id:'br-01', name:'تيل الفرامل الأمامي', nameEn:'Front Brake Pads' },
      { id:'br-02', name:'تيل الفرامل الخلفي', nameEn:'Rear Brake Pads' },
      { id:'br-03', name:'قرص الفرامل الأمامي', nameEn:'Front Brake Discs' },
      { id:'br-04', name:'قرص الفرامل الخلفي', nameEn:'Rear Brake Discs' },
      { id:'br-05', name:'طبلة الفرامل', nameEn:'Brake Drums' },
      { id:'br-06', name:'فرامل اليد', nameEn:'Handbrake' },
      { id:'br-07', name:'خراطيم الفرامل', nameEn:'Brake Hoses' },
      { id:'br-08', name:'ABS', nameEn:'ABS System' },
    ],
  },
  {
    id: 'sec-suspension',
    name: 'التعليق والتوجيه',
    icon: 'Car',
    color: '#8B5CF6',
    items: [
      { id:'su-01', name:'ممتصات الصدمات الأمامية', nameEn:'Front Shock Absorbers' },
      { id:'su-02', name:'ممتصات الصدمات الخلفية', nameEn:'Rear Shock Absorbers' },
      { id:'su-03', name:'الرفارف والمساند', nameEn:'Springs & Mounts' },
      { id:'su-04', name:'روؤس الكرة', nameEn:'Ball Joints' },
      { id:'su-05', name:'مقدمة العجلات (كاستر)', nameEn:'Wheel Alignment (Caster)' },
      { id:'su-06', name:'ميل العجلات (كامبر)', nameEn:'Wheel Camber' },
      { id:'su-07', name:'أذرع التعليق', nameEn:'Control Arms' },
      { id:'su-08', name:'جهاز التوجيه', nameEn:'Steering Rack' },
      { id:'su-09', name:'السلف', nameEn:'CV Joints / Driveshaft' },
    ],
  },
  {
    id: 'sec-tires',
    name: 'الإطارات والعجلات',
    icon: 'Circle',
    color: '#6B7280',
    items: [
      { id:'ti-01', name:'إطار أمامي أيمن', nameEn:'Front Right Tire' },
      { id:'ti-02', name:'إطار أمامي أيسر', nameEn:'Front Left Tire' },
      { id:'ti-03', name:'إطار خلفي أيمن', nameEn:'Rear Right Tire' },
      { id:'ti-04', name:'إطار خلفي أيسر', nameEn:'Rear Left Tire' },
      { id:'ti-05', name:'إطار الاستبدال', nameEn:'Spare Tire' },
      { id:'ti-06', name:'ضغط الإطارات', nameEn:'Tire Pressure' },
      { id:'ti-07', name:'توازن العجلات', nameEn:'Wheel Balance' },
      { id:'ti-08', name:'الجنوط', nameEn:'Wheel Rims' },
    ],
  },
  {
    id: 'sec-electrical',
    name: 'الكهرباء والأضواء',
    icon: 'Zap',
    color: '#F59E0B',
    items: [
      { id:'el-01', name:'المصابيح الأمامية', nameEn:'Headlights' },
      { id:'el-02', name:'المصابيح الخلفية', nameEn:'Tail Lights' },
      { id:'el-03', name:'أضواء الضباب', nameEn:'Fog Lights' },
      { id:'el-04', name:'إشارات الاتجاه', nameEn:'Turn Signals' },
      { id:'el-05', name:'مصابيح الفرامل', nameEn:'Brake Lights' },
      { id:'el-06', name:'ضوء الرجوع', nameEn:'Reverse Light' },
      { id:'el-07', name:'لوحة العدادات', nameEn:'Dashboard Gauges' },
      { id:'el-08', name:'مكيف الهواء', nameEn:'Air Conditioning' },
      { id:'el-09', name:'نظام الصوت', nameEn:'Audio System' },
      { id:'el-10', name:'الزجاج الكهربائي', nameEn:'Power Windows' },
      { id:'el-11', name:'المرايا الكهربائية', nameEn:'Electric Mirrors' },
      { id:'el-12', name:'أجهزة الاستشعار', nameEn:'Sensors / Warning Lights' },
    ],
  },
  {
    id: 'sec-body',
    name: 'الهيكل والمقصورة',
    icon: 'Shield',
    color: '#3B82F6',
    items: [
      { id:'bo-01', name:'الغطاء الأمامي (كبوت)', nameEn:'Hood' },
      { id:'bo-02', name:'الغطاء الخلفي (صندوق)', nameEn:'Trunk/Boot' },
      { id:'bo-03', name:'الأبواب', nameEn:'Doors' },
      { id:'bo-04', name:'زجاج الرؤية الأمامي', nameEn:'Windshield' },
      { id:'bo-05', name:'الزجاج الخلفي', nameEn:'Rear Window' },
      { id:'bo-06', name:'الجوانب والأبواب', nameEn:'Body Panels' },
      { id:'bo-07', name:'مساحات الزجاج', nameEn:'Windshield Wipers' },
      { id:'bo-08', name:'الدهان والصدأ', nameEn:'Paint & Rust' },
      { id:'bo-09', name:'المصدات', nameEn:'Bumpers' },
    ],
  },
  {
    id: 'sec-exhaust',
    name: 'العادم والوقود',
    icon: 'Wind',
    color: '#64748B',
    items: [
      { id:'ex-01', name:'ماسورة العادم', nameEn:'Exhaust Pipe' },
      { id:'ex-02', name:'كاتم الصوت', nameEn:'Muffler' },
      { id:'ex-03', name:'تسريب الوقود', nameEn:'Fuel Leaks' },
      { id:'ex-04', name:'مضخة الوقود', nameEn:'Fuel Pump' },
      { id:'ex-05', name:'المحفز (كتليك)', nameEn:'Catalytic Converter' },
    ],
  },
  {
    id: 'sec-battery',
    name: 'فحص البطارية والكهرباء',
    icon: 'BatteryCharging',
    color: '#10B981',
    items: [
      { id:'bat-01', name:'فولتية البطارية (V)', nameEn:'Battery Voltage (V)' },
      { id:'bat-02', name:'تيار الشحن (A)', nameEn:'Charging Current (A)' },
      { id:'bat-03', name:'حمل الاختبار (Load Test)', nameEn:'Battery Load Test' },
      { id:'bat-04', name:'حالة خلايا البطارية', nameEn:'Battery Cell Condition' },
      { id:'bat-05', name:'شرايط الشحن (الشرط)', nameEn:'Charging Terminals' },
      { id:'bat-06', name:'قياس الشحن من الدينمو', nameEn:'Alternator Output (A)' },
    ],
  },
  {
    id: 'sec-diagnostic',
    name: 'فحص جهاز التشخيص',
    icon: 'Cpu',
    color: '#6366F1',
    items: [
      { id:'diag-01', name:'أكواد الأعطال النشطة', nameEn:'Active Fault Codes (DTCs)' },
      { id:'diag-02', name:'أكواد الأعطال المحفوظة', nameEn:'Stored/Pending DTCs' },
      { id:'diag-03', name:'نظام السيارة (ECU)', nameEn:'ECU System Status' },
      { id:'diag-04', name:'بيانات الوقود الحي', nameEn:'Live Fuel Data' },
      { id:'diag-05', name:'حالة حساس الأكسجين', nameEn:'O2 Sensor Status' },
      { id:'diag-06', name:'نظام ABS / الفرامل الإلكتروني', nameEn:'ABS Electronic System' },
      { id:'diag-07', name:'نظام الوسادة الهوائية (Airbag)', nameEn:'Airbag System' },
    ],
  },
];

// ─── AVAILABLE ICONS FOR SECTIONS ───
export const AVAILABLE_ICONS = [
  'Cog','Settings2','CircleDot','Car','Circle','Zap','Shield','Wind',
  'BatteryCharging','Cpu','Wrench','Tool','Gauge','Activity','AlertTriangle',
  'CheckCircle','Flame','Droplets','Thermometer','Radio','Monitor','Key',
  'Camera','Flashlight','Package','Layers','BarChart','Scan',
];

interface InspectionStore {
  inspections:              VehicleInspection[];
  inspectionTemplate:       TemplateSection[];    // custom template
  lastReportNumber:         number;

  // Report number helpers
  generateReportNumber: () => string;

  // Inspection CRUD
  createInspection:   (data: Partial<VehicleInspection>) => VehicleInspection;
  updateItemStatus:   (inspId: string, sectionId: string, itemId: string, status: InspectionItemStatus, notes?: string) => void;
  updateInspection:   (id: string, updates: Partial<VehicleInspection>) => void;
  lockInspection:     (id: string) => void;
  deleteInspection:   (id: string) => void;
  getInspectionsByCar:(carId: string) => VehicleInspection[];

  // Attachments
  addAttachment:      (inspId: string, name: string, fileData: string, fileType: string) => void;
  deleteAttachment:   (inspId: string, attachmentId: string) => void;

  // Template management
  addTemplateSection:    (name: string, icon: string, color: string) => void;
  updateTemplateSection: (sectionId: string, updates: Partial<Pick<TemplateSection,'name'|'icon'|'color'>>) => void;
  deleteTemplateSection: (sectionId: string) => void;
  addTemplateItem:       (sectionId: string, name: string, nameEn: string) => void;
  updateTemplateItem:    (sectionId: string, itemId: string, name: string, nameEn: string) => void;
  deleteTemplateItem:    (sectionId: string, itemId: string) => void;
  resetTemplateToDefault:() => void;
}

export const useInspectionStore = create<InspectionStore>()(
  persist(
    (set, get) => ({
      inspections: [],
      inspectionTemplate: DEFAULT_INSPECTION_SECTIONS,
      lastReportNumber: 0,

      generateReportNumber: () => {
        const next   = (get().lastReportNumber || 0) + 1;
        const number = `INS-${String(next).padStart(4,'0')}`;
        set({ lastReportNumber: next });
        return number;
      },

      createInspection: (data) => {
        const reportNumber = get().generateReportNumber();

        // Use current template (or fallback to default)
        const template = get().inspectionTemplate?.length
          ? get().inspectionTemplate
          : DEFAULT_INSPECTION_SECTIONS;

        const sections: InspectionSection[] = template.map(sec => ({
          ...sec,
          items: sec.items.map(item => ({
            ...item,
            status: 'na' as InspectionItemStatus,
            notes:  '',
            images: [],
          })),
        }));

        const newInspection: VehicleInspection = {
          id:              `ins-${crypto.randomUUID()}`,
          carId:           data.carId || '',
          customerId:      data.customerId || '',
          inspectorName:   data.inspectorName || '',
          date:            data.date || new Date().toISOString(),
          odometer:        data.odometer || 0,
          reportNumber,
          overallStatus:   'good',
          sections,
          generalNotes:    '',
          recommendations: '',
          nextInspectionDate: '',
          nextInspectionKm:   0,
          customerSignature:  false,
          isLocked:        false,
          createdAt:       new Date().toISOString(),
          attachments:     [],
        };

        set(s => ({ inspections: [...s.inspections, newInspection] }));
        return newInspection;
      },

      updateItemStatus: (inspId, sectionId, itemId, status, notes) => {
        set(s => ({
          inspections: s.inspections.map(ins => {
            if (ins.id !== inspId) return ins;
            const sections = ins.sections.map(sec => {
              if (sec.id !== sectionId) return sec;
              return {
                ...sec,
                items: sec.items.map(item =>
                  item.id !== itemId ? item : {
                    ...item,
                    status,
                    notes: notes !== undefined ? notes : item.notes,
                  }
                ),
              };
            });
            const allItems = sections.flatMap(s => s.items).filter(i => i.status !== 'na');
            const overall =
              allItems.some(i => i.status === 'replace') ? 'poor' :
              allItems.some(i => i.status === 'attention') ? 'attention' : 'good';
            return { ...ins, sections, overallStatus: overall };
          }),
        }));
      },

      updateInspection: (id, updates) => {
        set(s => ({
          inspections: s.inspections.map(ins =>
            ins.id === id ? { ...ins, ...updates } : ins
          ),
        }));
      },

      lockInspection: (id) => {
        set(s => ({
          inspections: s.inspections.map(ins =>
            ins.id === id ? { ...ins, isLocked: true } : ins
          ),
        }));
      },

      deleteInspection: (id) => {
        set(s => ({
          inspections: s.inspections.filter(ins => ins.id !== id),
        }));
      },

      getInspectionsByCar: (carId) =>
        get().inspections.filter(i => i.carId === carId),

      // ─── ATTACHMENTS ─────────────────────────────────────
      addAttachment: (inspId, name, fileData, fileType) => {
        const att: InspectionAttachment = {
          id:         `att-${crypto.randomUUID()}`,
          name,
          fileData,
          fileType,
          uploadedAt: new Date().toISOString(),
        };
        set(s => ({
          inspections: s.inspections.map(ins =>
            ins.id !== inspId ? ins : {
              ...ins,
              attachments: [...(ins.attachments || []), att],
            }
          ),
        }));
      },

      deleteAttachment: (inspId, attachmentId) => {
        set(s => ({
          inspections: s.inspections.map(ins =>
            ins.id !== inspId ? ins : {
              ...ins,
              attachments: (ins.attachments || []).filter(a => a.id !== attachmentId),
            }
          ),
        }));
      },

      // ─── TEMPLATE MANAGEMENT ─────────────────────────────
      addTemplateSection: (name, icon, color) => {
        const newSec: TemplateSection = {
          id:    `sec-custom-${crypto.randomUUID().slice(0,8)}`,
          name,
          icon,
          color,
          items: [],
        };
        set(s => ({ inspectionTemplate: [...s.inspectionTemplate, newSec] }));
      },

      updateTemplateSection: (sectionId, updates) => {
        set(s => ({
          inspectionTemplate: s.inspectionTemplate.map(sec =>
            sec.id === sectionId ? { ...sec, ...updates } : sec
          ),
        }));
      },

      deleteTemplateSection: (sectionId) => {
        set(s => ({
          inspectionTemplate: s.inspectionTemplate.filter(sec => sec.id !== sectionId),
        }));
      },

      addTemplateItem: (sectionId, name, nameEn) => {
        const newItem: TemplateSectionItem = {
          id:     `item-${crypto.randomUUID().slice(0,8)}`,
          name,
          nameEn,
        };
        set(s => ({
          inspectionTemplate: s.inspectionTemplate.map(sec =>
            sec.id === sectionId
              ? { ...sec, items: [...sec.items, newItem] }
              : sec
          ),
        }));
      },

      updateTemplateItem: (sectionId, itemId, name, nameEn) => {
        set(s => ({
          inspectionTemplate: s.inspectionTemplate.map(sec =>
            sec.id !== sectionId ? sec : {
              ...sec,
              items: sec.items.map(item =>
                item.id === itemId ? { ...item, name, nameEn } : item
              ),
            }
          ),
        }));
      },

      deleteTemplateItem: (sectionId, itemId) => {
        set(s => ({
          inspectionTemplate: s.inspectionTemplate.map(sec =>
            sec.id !== sectionId ? sec : {
              ...sec,
              items: sec.items.filter(item => item.id !== itemId),
            }
          ),
        }));
      },

      resetTemplateToDefault: () => {
        set({ inspectionTemplate: DEFAULT_INSPECTION_SECTIONS });
      },
    }),
    { 
      name: 'inspection-store-v2',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure inspectionTemplate always has a value
          if (!state.inspectionTemplate || state.inspectionTemplate.length === 0) {
            state.inspectionTemplate = DEFAULT_INSPECTION_SECTIONS;
          }
          // Ensure all inspections have attachments array and sections
          state.inspections = (state.inspections || []).map(ins => {
            const sections = ins.sections || DEFAULT_INSPECTION_SECTIONS.map(sec => ({
              ...sec,
              items: (sec.items || []).map(item => ({
                ...item,
                status: 'na' as InspectionItemStatus,
                notes: '',
                images: [],
              })),
            }));
            return {
              ...ins,
              attachments: ins.attachments || [],
              sections,
              overallStatus: ins.overallStatus || 'good',
              reportNumber: ins.reportNumber || 'INS-0000',
            };
          });
        }
      },
    }
  )
);
