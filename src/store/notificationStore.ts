import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  type: 'debt' | 'reminder' | 'visit' | 'completed' | 'payment';
  title: string;
  body: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const initialNotifications: Notification[] = [
  {
    id: 'not1',
    type: 'debt',
    title: 'دين مستحق متأخر',
    body: 'الزبون محمد جاسم لديه فاتورة مستحقة الدفع INV-0003 بقيمة 25,000 د.ع منذ 5 أيام.',
    relatedId: 'c1',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'not2',
    type: 'reminder',
    title: 'تبديل زيت مستحق',
    body: 'سيارة هايلوكس للزبون يوسف عمر تجاوزت عداد الزيت المقترح (الحالي: 155,000، المقترح: 154,000).',
    relatedId: 'c3',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'not3',
    type: 'visit',
    title: 'زيارة بانتظار فني',
    body: 'تم استقبال سيارة موستانج للزبون عمر الفاروق وهي بانتظار بدء الفحص والصيانة.',
    relatedId: 'v2',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: initialNotifications,

      addNotification: (data) => {
        const newNot: Notification = {
          ...data,
          id: uuidv4(),
          isRead: false,
          createdAt: new Date().toISOString()
        };
        set((state) => ({ notifications: [newNot, ...state.notifications] }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
        }));
      },

      dismissNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      }
    }),
    {
      name: 'nozzle-notification-store',
      version: 1
    }
  )
);
