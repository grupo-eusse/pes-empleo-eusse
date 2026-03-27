// Tipos relacionados con autenticación y usuarios

export type UserRole = 'postulant' | 'hr' | 'admin';

export interface UserProfile {
  id: string;
  supabase_id: string;
  name: string;
  user_role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
}

// Rutas públicas que no requieren autenticación
export const PUBLIC_ROUTES = [
  '/',
  '/buscar-empleos',
  '/quienes-somos',
  '/faq',
  '/login',
  '/registro',
  '/registro-invitacion',
  '/recuperar',
];

// Rutas que requieren rol específico
export const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/dashboard/postulante': ['postulant'],
  '/dashboard/puestos': ['hr', 'admin'],
  '/dashboard/aplicaciones': ['hr', 'admin'],
  '/dashboard/resumes': ['hr', 'admin'],
  '/dashboard/configuracion': ['admin'],
  '/dashboard/metricas': ['admin'],
};

// Función para verificar si una ruta es pública
export function isPublicRoute(pathname: string): boolean {
  // Rutas exactas públicas
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  
  // Rutas dinámicas públicas (buscar-empleos/[jobId], aplicar/[jobId])
  if (pathname.startsWith('/buscar-empleos/')) return true;
  if (pathname.startsWith('/aplicar/')) return true;
  if (pathname.startsWith('/aplicar-general')) return true;
  
  // Ruta de callback de auth
  if (pathname.startsWith('/auth/callback')) return true;
  if (pathname.startsWith('/auth/invite')) return true;
  
  return false;
}

// Función para obtener los roles permitidos para una ruta
export function getAllowedRoles(pathname: string): UserRole[] | null {
  // Buscar coincidencia exacta primero
  if (ROLE_ROUTES[pathname]) {
    return ROLE_ROUTES[pathname];
  }
  
  // Buscar coincidencia por prefijo
  for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route)) {
      return roles;
    }
  }
  
  return null;
}

// Función para verificar si un usuario tiene acceso a una ruta
export function hasAccess(userRole: UserRole | null, pathname: string): boolean {
  if (isPublicRoute(pathname)) return true;
  if (!userRole) return false;
  
  const allowedRoles = getAllowedRoles(pathname);
  if (!allowedRoles) return false;
  
  return allowedRoles.includes(userRole);
}
