import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getInvitedAdminRole } from '@/lib/invite_utils';
import { buildInviteRegistrationPath, getSafeInternalPath } from '@/lib/invite_registration_utils';
import type { UserRole } from '@/types/auth';

const ROLE_REDIRECT: Record<UserRole, string> = {
  postulant: '/dashboard/postulante',
  hr: '/dashboard/puestos',
  admin: '/dashboard/puestos',
};

async function syncInvitedUserRole(user: { id: string; email?: string | null; user_metadata?: unknown }) {
  const invitedRole = getInvitedAdminRole(user.user_metadata);

  if (!invitedRole) {
    return;
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is required to sync invited roles');
    return;
  }

  const { error: profileError } = await adminClient
    .from('user_profile')
    .update({ user_role: invitedRole, is_active: true })
    .eq('supabase_id', user.id);

  if (profileError) {
    console.error('Error syncing invited role:', profileError);
  }

}

async function hasPendingInvite(user: { email?: string | null; user_metadata?: unknown }) {
  const invitedRole = getInvitedAdminRole(user.user_metadata);
  if (!invitedRole || !user.email) {
    return false;
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return false;
  }

  const { data, error } = await adminClient
    .from('user_invite')
    .select('id')
    .eq('email', user.email)
    .eq('role', invitedRole)
    .is('accepted_at', null)
    .maybeSingle();

  if (error) {
    console.error('Error checking pending invite:', error);
    return false;
  }

  return Boolean(data);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  const safePath = getSafeInternalPath(next);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch (err) {
              console.error('[auth/callback] Error setting cookies:', err);
              // Ignorado en Server Components de solo lectura
            }
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await syncInvitedUserRole(user);
        const shouldCompleteInvite = await hasPendingInvite(user);

        if (shouldCompleteInvite) {
          console.log('[auth/callback] Redirecting to invite registration');
          return NextResponse.redirect(`${origin}${buildInviteRegistrationPath(safePath)}`);
        }

        const { data: profile } = await supabase
          .from('user_profile')
          .select('user_role')
          .eq('supabase_id', user.id)
          .single();

        if (safePath) {
          return NextResponse.redirect(`${origin}${safePath}`);
        }

        const role = profile?.user_role as UserRole | undefined;
        const dest = (role && ROLE_REDIRECT[role]) || '/';
        return NextResponse.redirect(`${origin}${dest}`);
      }

      if (safePath) {
        return NextResponse.redirect(`${origin}${safePath}`);
      }

      return NextResponse.redirect(`${origin}/`);
    } else {
      console.error('[auth/callback] Error de exchangeCodeForSession:', error);
    }
  } else {
    // Puede llegar aquí con tokens en hash (#access_token), que el servidor no puede leer.
    // Entregamos una página mínima para reenviar en cliente preservando hash.
    console.error('[auth/callback] Entró sin code. Handoff cliente hacia /auth/invite preservando hash. Request URL:', request.url);

    const nextParam = safePath ? `?next=${encodeURIComponent(safePath)}` : '';
    const handoffHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Procesando invitacion</title>
  </head>
  <body>
    <script>
      (function () {
        var target = '/auth/invite${nextParam}' + (window.location.hash || '');
        window.location.replace(target);
      })();
    </script>
    <p>Procesando invitacion...</p>
  </body>
</html>`;

    return new Response(handoffHtml, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  console.error('[auth/callback] Redirigiendo a /login?error=auth_callback_error');
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
