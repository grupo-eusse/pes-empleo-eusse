import type { UserRole } from "@/types/auth";

export const PUBLIC_ROUTES = [
  "/",
  "/buscar-empleos",
  "/quienes-somos",
  "/faq",
  "/login",
  "/registro",
  "/registro-invitacion",
  "/recuperar",
] as const;

export const AUTH_ENTRY_ROUTES = ["/login", "/registro"] as const;

export const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/dashboard/postulante": ["postulant"],
  "/dashboard/puestos": ["hr", "admin"],
  "/dashboard/aplicaciones": ["hr", "admin"],
  "/dashboard/resumes": ["hr", "admin"],
  "/dashboard/configuracion": ["admin"],
  "/dashboard/metricas": ["admin"],
};

export const PROXY_MATCHER = [
  "/dashboard/:path*",
  "/login",
  "/registro",
] as const;

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number])) {
    return true;
  }

  if (pathname.startsWith("/buscar-empleos/")) return true;
  if (pathname.startsWith("/aplicar/")) return true;
  if (pathname.startsWith("/aplicar-general")) return true;
  if (pathname.startsWith("/auth/callback")) return true;

  return false;
}

export function isAuthEntryRoute(pathname: string): boolean {
  return AUTH_ENTRY_ROUTES.includes(pathname as (typeof AUTH_ENTRY_ROUTES)[number]);
}

export function getAllowedRoles(pathname: string): UserRole[] | null {
  if (ROLE_ROUTES[pathname]) {
    return ROLE_ROUTES[pathname];
  }

  for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route)) {
      return roles;
    }
  }

  return null;
}

export function getRedirectForRole(role: UserRole): string {
  switch (role) {
    case "postulant":
      return "/dashboard/postulante";
    case "hr":
    case "admin":
      return "/dashboard/puestos";
    default:
      return "/";
  }
}

export function shouldHandleWithProxy(pathname: string): boolean {
  return pathname.startsWith("/dashboard/") || isAuthEntryRoute(pathname);
}
