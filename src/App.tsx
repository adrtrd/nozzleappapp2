import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import CarDetails from './pages/CarDetails';
import Visits from './pages/Visits';
import VisitDetails from './pages/VisitDetails';
import Debts from './pages/Debts';
import Reports from './pages/Reports';
import InspectionDetailPage from './pages/InspectionDetail';

const SettingsPage = React.lazy(() => import('./pages/Settings'));

function ShortcutHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="بحث"]') as HTMLInputElement || 
                            document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Ctrl+N or Cmd+N
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        navigate('/visits?new=true');
      }

      // Escape
      if (e.key === 'Escape') {
        const closeBtn = document.querySelector('.close-modal') as HTMLButtonElement || 
                         document.querySelector('button[aria-label="Close"]') as HTMLButtonElement;
        if (closeBtn) {
          closeBtn.click();
        }
      }

      // Ctrl+P or Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        const printBtn = document.querySelector('.no-print button') as HTMLButtonElement;
        if (printBtn) {
          e.preventDefault();
          printBtn.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ShortcutHandler />
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: 'font-cairo text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-xl',
          duration: 3000,
          style: {
            direction: 'rtl',
          }
        }} 
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />
          
          {/* Customers */}
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerProfile />} />
          
          {/* Cars */}
          <Route path="cars/:id" element={<CarDetails />} />
          
          {/* Inspections */}
          <Route path="inspections/:inspectionId" element={<InspectionDetailPage />} />
          
          {/* Visits */}
          <Route path="visits" element={<Visits />} />
          <Route path="visits/:id" element={<VisitDetails />} />
          
          {/* Settings */}
          <Route
            path="settings"
            element={
              <ProtectedRoute permission="manage_settings">
                <React.Suspense
                  fallback={
                    <div style={{ padding: '40px', textAlign: 'center', direction: 'rtl' }}>
                      جاري تحميل الإعدادات...
                    </div>
                  }
                >
                  <SettingsPage />
                </React.Suspense>
              </ProtectedRoute>
            }
          />

          {/* Debts */}
          <Route
            path="debts"
            element={
              <ProtectedRoute permission="view_finance">
                <Debts />
              </ProtectedRoute>
            }
          />

          {/* Reports */}
          <Route
            path="reports"
            element={
              <ProtectedRoute permission="view_reports">
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirects to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
