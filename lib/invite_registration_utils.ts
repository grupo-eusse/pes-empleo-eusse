import type { UserRole } from "../types/auth";

export const INVITE_REGISTRATION_PATH = "/registro-invitacion";

const ROLE_REDIRECT: Record<Extract<UserRole, "hr" | "admin">, string> = {
  hr: "/dashboard/puestos",
  admin: "/dashboard/puestos",
};

export function getSafeInternalPath(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  return path;
}

export function buildInviteRegistrationPath(next: string | null | undefined): string {
  const safeNext = getSafeInternalPath(next);
  if (!safeNext) {
    return INVITE_REGISTRATION_PATH;
  }

  if (safeNext === INVITE_REGISTRATION_PATH) {
    return INVITE_REGISTRATION_PATH;
  }

  const params = new URLSearchParams({ next: safeNext });
  return `${INVITE_REGISTRATION_PATH}?${params.toString()}`;
}

export function getPostInviteRedirect(
  role: Extract<UserRole, "hr" | "admin">,
  next: string | null | undefined,
): string {
  return getSafeInternalPath(next) ?? ROLE_REDIRECT[role];
}

export function shouldForceInviteOnboarding(pathname: string, hasPendingInvite: boolean): boolean {
  if (!hasPendingInvite) {
    return false;
  }

  return pathname.startsWith("/dashboard/") || pathname === "/login" || pathname === "/registro";
}
