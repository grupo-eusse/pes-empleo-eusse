'use server';

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY ?? '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN ?? '';
const MAILGUN_FROM = process.env.MAILGUN_FROM ?? `Portal Empleo Eusse <no-reply@${MAILGUN_DOMAIN}>`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.error('Mailgun not configured: MAILGUN_API_KEY or MAILGUN_DOMAIN missing');
    return { success: false, error: 'Servicio de correo no configurado' };
  }

  const form = new URLSearchParams();
  form.append('from', MAILGUN_FROM);
  form.append('to', to);
  form.append('subject', subject);
  form.append('html', html);

  try {
    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
      },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Mailgun error:', text);
      return { success: false, error: 'Error al enviar el correo' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Error al conectar con el servicio de correo' };
  }
}

export async function buildInviteEmailHtml(email: string, role: string, token: string): Promise<string> {
  const inviteUrl = `${SITE_URL}/registro?invite=${encodeURIComponent(token)}`;
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
