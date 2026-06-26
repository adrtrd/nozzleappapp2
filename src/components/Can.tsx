import React from 'react';
import { useAuthStore } from '../store/authStore';

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  
  return hasPermission(permission)
    ? <>{children}</>
    : <>{fallback}</>;
};

export default Can;
