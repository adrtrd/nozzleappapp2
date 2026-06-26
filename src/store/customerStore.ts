import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  tags: string[];
  avatarColor: string;
  createdAt: string;
  createdBy: string;
}

export interface Car {
  id: string;
  customerId: string;
  name: string;
  brand: string;
  year: number;
  color: string;
  colorHex?: string;
  category: 'Sedan' | 'SUV' | 'Pickup' | 'Van' | 'Luxury' | 'Other';
  plateNumber: string;
  chassisNumber: string;
  odometer: number;
  notes: string;
  createdAt: string;
}

export interface CustomerDocument {
  id: string;
  customerId: string;
  visitId?: string;
  name: string;
  type: string; // pdf, image
  fileData: string; // base64 encoded data
  uploadedAt: string;
  uploadedBy: string;
}

interface CustomerState {
  customers: Customer[];
  cars: Car[];
  customerDocuments: CustomerDocument[];

  // Actions
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'avatarColor' | 'tags'> & { tags?: string[] }) => string;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addCar: (car: Omit<Car, 'id' | 'createdAt'>) => void;
  updateCar: (id: string, updates: Partial<Car>) => void;
  deleteCar: (id: string) => void;
  addDocument: (doc: Omit<CustomerDocument, 'id' | 'uploadedAt'>) => void;
  deleteDocument: (id: string) => void;
}

// Helper to generate a random dark/slate color based on name hash
const getAvatarColor = (name: string) => {
  const colors = [
    '#4f46e5', '#0891b2', '#0d9488', '#059669', '#b45309', '#be123c', '#6d28d9', '#475569'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const initialCustomers: Customer[] = [
  { id: 'c1', name: 'محمد جاسم', phone: '07701234567', address: 'بغداد، المنصور', notes: 'زبون دائم يفضل زيت 5W-30 للسيارة الكامري', tags: ['مميز'], avatarColor: '#4f46e5', createdAt: '2025-12-20', createdBy: 'u3' },
  { id: 'c2', name: 'عمر الفاروق', phone: '07802223333', address: 'البصرة، العشار', notes: 'يرجى الاتصال به دائماً قبل إضافة أي خدمة إضافية', tags: ['ذو أولوية'], avatarColor: '#0891b2', createdAt: '2026-01-20', createdBy: 'u3' },
  { id: 'c3', name: 'يوسف عمر', phone: '07503334444', address: 'أربيل، عينكاوة', notes: 'زبون مهتم جداً بمواعيد صيانة سيارة العمل (هايلوكس)', tags: ['VIP'], avatarColor: '#0d9488', createdAt: '2026-02-18', createdBy: 'u3' }
];

const initialCars: Car[] = [
  { id: 'car1', customerId: 'c1', name: 'كامري', brand: 'تويوتا', year: 2021, color: 'أبيض', colorHex: '#ffffff', category: 'Sedan', plateNumber: 'بغداد - 12345 أ', chassisNumber: 'VIN12345CAMRY00987', odometer: 45200, notes: '', createdAt: '2025-12-20' },
  { id: 'car2', customerId: 'c1', name: 'توسان', brand: 'هيونداي', year: 2019, color: 'أسود', colorHex: '#000000', category: 'SUV', plateNumber: 'نينوى - 98765 ب', chassisNumber: 'VIN67890TUCSON8876', odometer: 82000, notes: '', createdAt: '2025-12-30' },
  { id: 'car3', customerId: 'c2', name: 'موستانج', brand: 'فورد', year: 2018, color: 'أحمر', colorHex: '#ef4444', category: 'Luxury', plateNumber: 'البصرة - 55555 د', chassisNumber: 'VIN55555MUSTANG990', odometer: 60100, notes: '', createdAt: '2026-01-20' },
  { id: 'car4', customerId: 'c2', name: 'تاهو', brand: 'شيفورليه', year: 2022, color: 'رمادي', colorHex: '#6b7280', category: 'SUV', plateNumber: 'بغداد - 44321 هـ', chassisNumber: 'VIN44321TAHOE88771', odometer: 30000, notes: '', createdAt: '2026-01-30' },
  { id: 'car5', customerId: 'c3', name: 'سبورتاج', brand: 'كيا', year: 2020, color: 'أزرق', colorHex: '#3b82f6', category: 'SUV', plateNumber: 'أربيل - 77777 أ', chassisNumber: 'VIN77777SPORT0098', odometer: 95000, notes: '', createdAt: '2026-02-18' },
  { id: 'car6', customerId: 'c3', name: 'هايلوكس', brand: 'تويوتا', year: 2017, color: 'أبيض', colorHex: '#ffffff', category: 'Pickup', plateNumber: 'دهوك - 88888 ج', chassisNumber: 'VIN88888HILUX2234', odometer: 155000, notes: '', createdAt: '2026-02-28' }
];

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: initialCustomers,
      cars: initialCars,
      customerDocuments: [],

      addCustomer: (customerData) => {
        const id = uuidv4();
        const avatarColor = getAvatarColor(customerData.name);
        const newCustomer: Customer = {
          ...customerData,
          id,
          tags: customerData.tags || [],
          avatarColor,
          createdAt: new Date().toISOString().split('T')[0]
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
        return id;
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c))
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
          cars: state.cars.filter((car) => car.customerId !== id),
          customerDocuments: state.customerDocuments.filter((doc) => doc.customerId !== id)
        }));
      },

      addCar: (carData) => {
        const newCar: Car = {
          ...carData,
          id: uuidv4(),
          createdAt: new Date().toISOString().split('T')[0]
        };
        set((state) => ({ cars: [...state.cars, newCar] }));
      },

      updateCar: (id, updates) => {
        set((state) => ({
          cars: state.cars.map((c) => (c.id === id ? { ...c, ...updates } : c))
        }));
      },

      deleteCar: (id) => {
        set((state) => ({
          cars: state.cars.filter((c) => c.id !== id)
        }));
      },

      addDocument: (docData) => {
        const newDoc: CustomerDocument = {
          ...docData,
          id: uuidv4(),
          uploadedAt: new Date().toISOString()
        };
        set((state) => ({ customerDocuments: [...state.customerDocuments, newDoc] }));
      },

      deleteDocument: (id) => {
        set((state) => ({
          customerDocuments: state.customerDocuments.filter((doc) => doc.id !== id)
        }));
      }
    }),
    {
      name: 'nozzle-customer-store',
      version: 1
    }
  )
);
