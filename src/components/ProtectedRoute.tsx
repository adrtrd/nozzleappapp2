import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
  const isAuth = useAuthStore((s) => s.isAuth);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        height:         '60vh',
        direction:      'rtl',
        gap:            '12px',
      }}>
        <ShieldOff size={48} color="#DC2626" />
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>
          غير مصرح
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          ليس لديك صلاحية للوصول لهذه الصفحة
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
