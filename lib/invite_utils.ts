import type { UserRole } from "@/types/auth";

type AdminInviteRole = Extract<UserRole, "hr" | "admin">;

const INTERNAL_INVITE_REDIRECT_PATH = "/dashboard/puestos";
const INVITE_CALLBACK_PATH = "/auth/callback";

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
}

export function isAdminInviteRole(role: unknown): role is AdminInviteRole {
  return role === "hr" || role === "admin";
}

export function buildSupabaseInviteOptions(siteUrl: string, role: AdminInviteRole) {
  const redirectUrl = new URL(`${normalizeSiteUrl(siteUrl)}${INVITE_CALLBACK_PATH}`);
  redirectUrl.searchParams.set("next", INTERNAL_INVITE_REDIRECT_PATH);

  return {
    data: {
      invited_role: role,
    },
    redirectTo: redirectUrl.toString(),
  };
}

export function getInvitedAdminRole(metadata: unknown): AdminInviteRole | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const invitedRole = (metadata as { invited_role?: unknown }).invited_role;
  return isAdminInviteRole(invitedRole) ? invitedRole : null;
}
