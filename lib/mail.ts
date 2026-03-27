type MailgunEnv = {
  MAILGUN_API_KEY?: string | undefined;
  MAILGUN_DOMAIN?: string | undefined;
  MAILGUN_FROM?: string | undefined;
  MAILGUN_REGION?: string | undefined;
  MAILGUN_API_BASE_URL?: string | undefined;
  [key: string]: string | undefined;
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface InviteEmailOptions {
  role: string;
  inviteUrl: string;
}

interface MailgunErrorContext {
  status: number;
  apiBaseUrl: string;
  domain: string;
  from: string;
  body: string;
}

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function getMailgunDomainError(domain: string): string | undefined {
  if (!domain) {
    return "MAILGUN_DOMAIN no esta configurado";
  }

  if (domain === "smtp.mailgun.org" || domain === "api.mailgun.net" || domain === "api.eu.mailgun.net") {
    return "MAILGUN_DOMAIN debe ser tu dominio de envio de Mailgun, no un host SMTP/API";
  }

  return undefined;
}

export function resolveMailgunConfig(env: MailgunEnv = process.env) {
  const apiKey = env.MAILGUN_API_KEY ?? "";
  const domain = env.MAILGUN_DOMAIN ?? "";
  const from = env.MAILGUN_FROM ?? `Portal Empleo Eusse <no-reply@${domain}>`;
  const apiBaseUrl = normalizeApiBaseUrl(
    env.MAILGUN_API_BASE_URL
      ?? (env.MAILGUN_REGION?.toLowerCase() === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net"),
  );
  const domainError = getMailgunDomainError(domain);
  const configured = Boolean(apiKey && domain) && !domainError;

  return {
    configured,
    apiKey,
    domain,
    from,
    error: !apiKey ? "MAILGUN_API_KEY no esta configurado" : domainError,
    apiBaseUrl,
    apiUrl: `${apiBaseUrl}/v3/${domain}/messages`,
  };
}

export function buildMailgunErrorDetails({ status, apiBaseUrl, domain, from, body }: MailgunErrorContext) {
  let hint: string | undefined;

  if (status === 401) {
    hint = "Mailgun devolvio 401 Unauthorized. Revisa MAILGUN_API_KEY.";
  } else if (status === 403) {
    hint =
      `Mailgun devolvio 403 Forbidden. Revisa que la API key pertenezca a la cuenta de Mailgun correcta, ` +
      `que el dominio ${domain} exista y este verificado en Mailgun, y que el remitente ${from} sea valido para ese dominio.`;
  } else if (status === 404) {
    hint = `Mailgun devolvio 404. Revisa MAILGUN_DOMAIN (${domain}) y la base API (${apiBaseUrl}).`;
  }

  return {
    status,
    apiBaseUrl,
    domain,
    from,
    body,
    hint,
  };
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const config = resolveMailgunConfig();

  if (!config.configured) {
    console.error('Mailgun not configured:', config.error ?? 'MAILGUN_API_KEY or MAILGUN_DOMAIN missing');
    return { success: false, error: config.error ?? 'Servicio de correo no configurado' };
  }

  const form = new URLSearchParams();
  form.append('from', config.from);
  form.append('to', to);
  form.append('subject', subject);
  form.append('html', html);

  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString('base64')}`,
      },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Mailgun error:', buildMailgunErrorDetails({
        status: response.status,
        apiBaseUrl: config.apiBaseUrl,
        domain: config.domain,
        from: config.from,
        body: text,
      }));
      return { success: false, error: 'Error al enviar el correo' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Error al conectar con el servicio de correo' };
  }
}

export function buildInviteEmailSubject(role: string): string {
  const roleName = role === 'admin' ? 'Administrador' : 'RRHH';
  return `Invitacion al equipo ${roleName}`;
}

export async function buildInviteEmailHtml({ role, inviteUrl }: InviteEmailOptions): Promise<string> {
  const roleName = role === 'admin' ? 'Administrador' : 'Recursos Humanos';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #4f7942; margin: 0;">Portal de Empleo Eusse</p>
    <h1 style="font-size: 24px; color: #1a2e1a; margin: 12px 0 0;">Invitación al equipo</h1>
    <p style="color: #4a5a4a; line-height: 1.6; margin-top: 16px;">
      Has sido invitado/a a unirte al Portal de Empleo de Grupo Empresarial Eusse como <strong>${roleName}</strong>.
    </p>
    <a href="${inviteUrl}" style="display: inline-block; margin-top: 24px; padding: 14px 32px; background: #4f7942; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">
      Aceptar invitación
    </a>
    <p style="margin-top: 24px; font-size: 13px; color: #7a8a7a;">
      Si no esperabas esta invitación, puedes ignorar este correo.
    </p>
  </div>
</body>
</html>`;
}
