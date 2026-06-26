import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { useUserStore, User } from './userStore';
import { useActivityLogStore } from './activityLogStore';

export type UserRole = 'admin' | 'technician' | 'receptionist' | 'accountant';

export interface UserPermissions {
  userId: string;
  role: UserRole;
  permissions: string[];
}

interface AuthStore {
  currentUser:  User | null;
  isAuth:       boolean;
  loginAttempts: number;
  lockedUntil:  string | null;
  login:   (email: string, pass: string) => { success: boolean; error?: string };
  logout:  () => void;
  hasPermission: (action: string) => boolean;
}

const PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'view_all', 'add_customer', 'edit_customer',
    'delete_customer', 'add_car', 'edit_car',
    'delete_car', 'add_visit', 'edit_visit',
    'close_visit', 'delete_visit', 'unlock_visit',
    'add_service', 'edit_service', 'delete_service',
    'add_payment', 'delete_payment',
    'view_reports', 'export_data',
    'manage_users', 'manage_settings',
    'print_invoice', 'view_finance',
  ],
  receptionist: [
    'view_all', 'add_customer', 'edit_customer',
    'add_car', 'edit_car',
    'add_visit', 'close_visit',
    'add_service', 'add_payment',
    'print_invoice',
  ],
  technician: [
    'view_all', 'add_service', 'edit_visit',
    'print_invoice',
  ],
  accountant: [
    'view_all', 'add_payment', 'delete_payment',
    'view_finance', 'view_reports', 'export_data',
    'print_invoice',
  ],
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser:   null,
      isAuth:        false,
      loginAttempts: 0,
      lockedUntil:   null,

      login: (email, password) => {
        // Check lockout
        const { lockedUntil, loginAttempts } = get();
        if (lockedUntil && new Date(lockedUntil) > new Date()) {
          const mins = Math.ceil(
            (new Date(lockedUntil).getTime() - Date.now()) / 60000
          );
          const errorMsg = `الحساب مقفل مؤقتاً. حاول بعد ${mins} دقيقة`;
          toast.error(errorMsg);
          return { success: false, error: errorMsg };
        }

        const users = useUserStore.getState().users;
        const user  = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.isActive
        );

        if (!user) {
          const errorMsg = 'البريد الإلكتروني غير مسجل أو الحساب غير نشط';
          toast.error(errorMsg);
          return { success: false, error: errorMsg };
        }

        if (user.password !== password) {
          const attempts = loginAttempts + 1;
          if (attempts >= 5) {
            // Lock for 15 minutes
            const lockTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            set({ loginAttempts: 0, lockedUntil: lockTime });
            const errorMsg = 'تم قفل الحساب 15 دقيقة بسبب محاولات متعددة خاطئة';
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
          } else {
            set({ loginAttempts: attempts });
            const errorMsg = `كلمة المرور خاطئة — محاولة ${attempts} من 5`;
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
          }
        }

        // Success
        useUserStore.getState().updateLastLogin(user.id);
        set({
          currentUser: {
            ...user,
            lastLogin: new Date().toISOString()
          },
          isAuth:        true,
          loginAttempts: 0,
          lockedUntil:   null,
        });

        // Log LOGIN action
        useActivityLogStore.getState().addLog({
          action: 'LOGIN',
          entity: 'user',
          entityId: user.id,
          details: `تسجيل دخول ناجح للمستخدم ${user.name}`,
          user: user.name,
        });

        toast.success(`أهلاً بك، ${user.name}`);
        return { success: true };
      },

      logout: () => {
        const user = get().currentUser;
        if (user) {
          useActivityLogStore.getState().addLog({
            action: 'LOGOUT',
            entity: 'user',
            entityId: user.id,
            details: `تسجيل خروج للمستخدم ${user.name}`,
            user: user.name,
          });
        }
        set({ currentUser: null, isAuth: false });
        toast.success('تم تسجيل الخروج بنجاح');
      },

      hasPermission: (action: string): boolean => {
        const user = get().currentUser;
        if (!user) return false;
        const perms = PERMISSIONS[user.role] || [];
        return perms.includes(action);
      },
    }),
    { name: 'auth-store-v1' }
  )
);
