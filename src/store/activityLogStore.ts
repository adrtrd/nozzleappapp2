import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ActivityLog {
  id:        string;
  action:    string;
  entity:    string;
  entityId:  string;
  details:   string;
  user:      string;
  timestamp: string;
}

interface ActivityLogStore {
  logs: ActivityLog[];
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useActivityLogStore = create<ActivityLogStore>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (logData) =>
        set((state) => ({
          logs: [
            {
              ...logData,
              id: `log-${crypto.randomUUID()}`,
              timestamp: new Date().toISOString(),
            },
            ...state.logs.slice(0, 999), // keep last 1000 logs
          ],
        })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'nozzle-activity-log-v1',
    }
  )
);
