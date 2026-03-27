type InviteEnv = {
  MAILGUN_API_KEY?: string | undefined;
  MAILGUN_DOMAIN?: string | undefined;
  [key: string]: string | undefined;
};

type InviteAdminClient = {
  auth: {
    admin: {
      inviteUserByEmail: (
        email: string,
        options: { data: { invited_role: "hr" | "admin" }; redirectTo: string },
      ) => Promise<{ error: { message: string } | null }>;
      generateLink: (params: {
        type: "invite";
        email: string;
        options: { data: { invited_role: "hr" | "admin" }; redirectTo: string };
      }) => Promise<{
        data: { properties: { action_link?: string | null } | null };
        error: { message: string } | null;
      }>;
    };
  };
};

type Mailer = (options: {
  to: string;
  subject: string;
  html: string;
}) => Promise<{ success: boolean; error?: string }>;

interface SendAdminInviteParams {
  adminClient: InviteAdminClient;
  email: string;
  role: "hr" | "admin";
  siteUrl: string;
  env?: InviteEnv;
  mailer?: Mailer;
}

export function isCustomInviteEmailConfigured(env: InviteEnv = process.env): boolean {
  return Boolean(env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN);
}

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
}

function isAdminInviteRole(role: unknown): role is "hr" | "admin" {
  return role === "hr" || role === "admin";
}

function buildSupabaseInviteOptions(siteUrl: string, role: "hr" | "admin") {
  const redirectUrl = new URL(`${normalizeSiteUrl(siteUrl)}/auth/invite`);      
  redirectUrl.searchParams.set("next", "/dashboard/puestos");

  return {
    data: {
      invited_role: role,
    },
    redirectTo: redirectUrl.toString(),
  };
}

function buildInviteEmailSubject(role: string): string {
  const roleName = role === "admin" ? "Administrador" : "RRHH";
  return `Invitacion al equipo ${roleName}`;
}

async function buildInviteEmailHtml({
  role,
  inviteUrl,
}: {
  role: string;
  inviteUrl: string;
}): Promise<string> {
  const roleName = role === "admin" ? "Administrador" : "Recursos Humanos";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #4f7942; margin: 0;">Portal de Empleo Eusse</p>
    <h1 style="font-size: 24px; color: #1a2e1a; margin: 12px 0 0;">Invitacion al equipo</h1>
    <p style="color: #4a5a4a; line-height: 1.6; margin-top: 16px;">
      Has sido invitado/a a unirte al Portal de Empleo de Grupo Empresarial Eusse como <strong>${roleName}</strong>.
    </p>
    <a href="${inviteUrl}" style="display: inline-block; margin-top: 24px; padding: 14px 32px; background: #4f7942; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">
      Aceptar invitacion
    </a>
    <p style="margin-top: 24px; font-size: 13px; color: #7a8a7a;">
      Si no esperabas esta invitacion, puedes ignorar este correo.
    </p>
  </div>
</body>
</html>`;
}

export async function sendAdminInvite({
  adminClient,
  email,
  role,
  siteUrl,
  env = process.env,
  mailer,
}: SendAdminInviteParams): Promise<{ error?: string }> {
  if (!isAdminInviteRole(role)) {
    return { error: "El rol debe ser hr o admin" };
  }

  const inviteOptions = buildSupabaseInviteOptions(siteUrl, role);

  if (!isCustomInviteEmailConfigured(env)) {
    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, inviteOptions);
    return error ? { error: error.message } : {};
  }

  if (!mailer) {
    return { error: "No hay un servicio de correo configurado para invitaciones personalizadas" };
  }

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "invite",
    email,
    options: inviteOptions,
  });

  if (error) {
    return { error: error.message };
  }

  const inviteUrl = data.properties?.action_link;
  if (!inviteUrl) {
    return { error: "Supabase no devolvio un enlace de invitacion valido" };
  }

  const html = await buildInviteEmailHtml({ role, inviteUrl });
  const emailResult = await mailer({
    to: email,
    subject: buildInviteEmailSubject(role),
    html,
  });

  return emailResult.success ? {} : { error: emailResult.error ?? "Error al enviar el correo" };
}
