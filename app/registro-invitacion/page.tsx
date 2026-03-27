import { redirect } from "next/navigation";
import InviteRegistrationForm from "./invite_registration_form";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInvitedAdminRole } from "@/lib/invite_utils";
import { getPostInviteRedirect, getSafeInternalPath } from "@/lib/invite_registration_utils";
import type { UserRole } from "@/types/auth";

type SearchParams = Promise<{
  next?: string;
}>;

const ROLE_LABELS = {
  admin: "Administrador",
  hr: "Recursos Humanos",
} as const;

function getDashboardRedirect(role?: UserRole): string {
  if (role === "postulant") {
    return "/dashboard/postulante";
  }

  if (role === "admin" || role === "hr") {
    return "/dashboard/puestos";
  }

  return "/login";
}

export default async function InviteRegistrationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = getSafeInternalPath(resolvedSearchParams.next) ?? "";
  const { user, profile } = await getCurrentUser();

  if (!user || !user.email) {
    redirect("/login?returnUrl=/registro-invitacion");
  }

  const invitedRole = getInvitedAdminRole(user.user_metadata);
  if (!invitedRole) {
    redirect(getDashboardRedirect(profile?.user_role));
  }

  const supabase = await createClient();
  if (!supabase) {
    redirect("/login?error=invite_session_error");
  }

  const inviteLookup = createAdminClient() ?? supabase;
  const { data: pendingInvite } = await inviteLookup
    .from("user_invite")
    .select("id")
    .eq("email", user.email)
    .eq("role", invitedRole)
    .is("accepted_at", null)
    .maybeSingle();

  if (!pendingInvite) {
    redirect(getPostInviteRedirect(invitedRole, nextPath));
  }

  const metadataName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";

  return (
    <InviteRegistrationForm
      email={user.email}
      initialName={profile?.name || metadataName}
      roleLabel={ROLE_LABELS[invitedRole]}
      nextPath={nextPath}
    />
  );
}
