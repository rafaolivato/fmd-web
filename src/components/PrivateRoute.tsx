import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../store/store';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'farmaceutico' | 'almoxarife';
}

export function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
  
    
    // Em vez de redirecionar para dashboard, pode mostrar um componente de acesso negado
    // ou redirecionar para uma página específica
    return (
      <Navigate 
        to="/dashboard" 
        state={{ 
          message: `Apenas ${requiredRole}s podem acessar esta página.`,
          requiredRole 
        }}
      />
    );
    
    // Alternativa: Mostrar componente inline
    // return <AccessDenied requiredRole={requiredRole} />;
  }

  return <>{children}</>;
}