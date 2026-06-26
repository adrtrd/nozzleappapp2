import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id:        string;
  name:      string;
  email:     string;
  password:  string;
  role:      'admin' | 'receptionist' | 'technician' | 'accountant';
  isActive:  boolean;
  avatar:    string | null;
  createdAt: string;
  lastLogin: string | null;
}

interface UserStore {
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  updateLastLogin: (userId: string) => void;
}

const initialUsers: User[] = [
  {
    id:        'user-admin-001',
    name:      'المدير',
    email:     'admin@center.com',
    password:  'admin123',
    role:      'admin',
    isActive:  true,
    avatar:    null,
    createdAt: new Date().toISOString(),
    lastLogin: null,
  },
  {
    id:        'u2',
    name:      'علي الفني',
    email:     'tech@nozzle.com',
    password:  'tech',
    role:      'technician',
    isActive:  true,
    avatar:    null,
    createdAt: new Date().toISOString(),
    lastLogin: null,
  },
  {
    id:        'u3',
    name:      'سارة الاستقبال',
    email:     'recep@nozzle.com',
    password:  'recep',
    role:      'receptionist',
    isActive:  true,
    avatar:    null,
    createdAt: new Date().toISOString(),
    lastLogin: null,
  },
  {
    id:        'u4',
    name:      'خالد المحاسب',
    email:     'acct@nozzle.com',
    password:  'acct',
    role:      'accountant',
    isActive:  true,
    avatar:    null,
    createdAt: new Date().toISOString(),
    lastLogin: null,
  }
];

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      users: initialUsers,
      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: `user-${crypto.randomUUID()}`,
          createdAt: new Date().toISOString(),
          lastLogin: null,
        };
        set((s) => ({ users: [...s.users, newUser] }));
      },
      updateUser: (id, updates) => {
        set((s) => ({
          users: s.users.map((u) => u.id === id ? { ...u, ...updates } : u)
        }));
      },
      deleteUser: (id) => {
        set((s) => ({
          users: s.users.filter((u) => u.id !== id)
        }));
      },
      updateLastLogin: (userId) => {
        set((s) => ({
          users: s.users.map((u) => u.id === userId ? { ...u, lastLogin: new Date().toISOString() } : u)
        }));
      }
    }),
    {
      name: 'nozzle-user-store-v1'
    }
  )
);
