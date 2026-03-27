'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getInvitedAdminRole } from '@/lib/invite_utils';
import { getPostInviteRedirect } from '@/lib/invite_registration_utils';
import type { UserRole } from '@/types/auth';

export interface AuthResult {
  error?: string;
  success?: boolean;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const ROLE_REDIRECT: Record<UserRole, string> = {
  postulant: '/dashboard/postulante',
  hr:        '/dashboard/puestos',
  admin:     '/dashboard/puestos',
};

function getRedirectForRole(role?: UserRole): string {
  return (role && ROLE_REDIRECT[role]) || '/';
}

async function getSupabase() {
  const supabase = await createClient();
  if (!supabase) throw new Error('Error de configuración del servidor');
  return supabase;
}

// ─── Actions ────────────────────────────────────────────────────────────────

export async function login(formData: FormData): Promise<AuthResult> {
  const email    = formData.get('email') as string;
  const password = formData.get('password') as string;
  const returnUrl = formData.get('returnUrl') as string | null;

  if (!email || !password) return { error: 'Email y contraseña son requeridos' };

  let supabase;
  try { supabase = await getSupabase(); } catch (e: unknown) { return { error: (e as Error).message }; }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile }  = user
    ? await supabase.from('user_profile').select('user_role').eq('supabase_id', user.id).single()
    : { data: null };

  revalidatePath('/', 'layout');

  // Respect returnUrl if it's a safe internal path
  if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
    redirect(returnUrl);
  }

  redirect(getRedirectForRole(profile?.user_role as UserRole));
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const email    = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  if (!email || !password || !fullName) return { error: 'Todos los campos son requeridos' };
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres' };

  let supabase;
  try { supabase = await getSupabase(); } catch (e: unknown) { return { error: (e as Error).message }; }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${SITE_URL}/auth/callback`,
    },
  });

  return error ? { error: error.message } : { success: true };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!email) return { error: 'El correo electrónico es requerido' };

  let supabase;
  try { supabase = await getSupabase(); } catch (e: unknown) { return { error: (e as Error).message }; }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/auth/reset-password`,
  });

  return error ? { error: error.message } : { success: true };
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  if (!newPassword || newPassword.length < 8)
    return { error: 'La contraseña debe tener al menos 8 caracteres' };

  let supabase;
  try { supabase = await getSupabase(); } catch (e: unknown) { return { error: (e as Error).message }; }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? { error: error.message } : { success: true };
}

export async function completeInviteRegistration(formData: FormData): Promise<AuthResult> {
  const fullName = formData.get('fullName') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const next = formData.get('next') as string | null;

  if (!fullName?.trim() || !password || !confirmPassword) {
    return { error: 'Todos los campos son requeridos' };
  }

  if (password.length < 8) {
    return { error: 'La contrasena debe tener al menos 8 caracteres' };
  }

  if (password !== confirmPassword) {
    return { error: 'Las contrasenas no coinciden' };
  }

  let supabase;
  try { supabase = await getSupabase(); } catch (e: unknown) { return { error: (e as Error).message }; }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: 'Sesion invalida para completar la invitacion' };
  }

  const invitedRole = getInvitedAdminRole(user.user_metadata);
  if (!invitedRole) {
    return { error: 'Esta sesion no corresponde a una invitacion pendiente' };
  }

  const adminClient = createAdminClient();
  const inviteLookup = adminClient ?? supabase;
  const { data: pendingInvite, error: inviteFetchError } = await inviteLookup
    .from('user_invite')
    .select('id')
    .eq('email', user.email)
    .eq('role', invitedRole)
    .is('accepted_at', null)
    .maybeSingle();

  if (inviteFetchError) {
    return { error: inviteFetchError.message };
  }

  if (!pendingInvite) {
    return { error: 'La invitacion ya fue completada o no existe' };
  }

  const trimmedName = fullName.trim();
  const { error: updateUserError } = await supabase.auth.updateUser({
    password,
    data: {
      ...(user.user_metadata ?? {}),
      full_name: trimmedName,
    },
  });

  if (updateUserError) {
    return { error: updateUserError.message };
  }

  const { error: profileError } = await supabase
    .from('user_profile')
    .update({ name: trimmedName, user_role: invitedRole, is_active: true })
    .eq('supabase_id', user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  if (adminClient) {
    const { error: inviteUpdateError } = await adminClient
      .from('user_invite')
      .update({ accepted_at: new Date().toISOString() })
      .eq('email', user.email)
      .eq('role', invitedRole)
      .is('accepted_at', null);

    if (inviteUpdateError) {
      return { error: inviteUpdateError.message };
    }
  } else {
    const { error: inviteUpdateError } = await supabase
      .from('user_invite')
      .update({ accepted_at: new Date().toISOString() })
      .eq('email', user.email)
      .eq('role', invitedRole)
      .is('accepted_at', null);

    if (inviteUpdateError) {
      return { error: inviteUpdateError.message };
    }
  }

  revalidatePath('/', 'layout');
  revalidatePath('/dashboard/configuracion');
  redirect(getPostInviteRedirect(invitedRole, next));
}

export async function loginWithGoogle(): Promise<{ url: string } | AuthResult> {
  let supabase;
  try { supabase = await getSupabase(); } catch (e: unknown) { return { error: (e as Error).message }; }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${SITE_URL}/auth/callback` },
  });

  if (error)    return { error: error.message };
  if (data.url) return { url: data.url };
  return { error: 'No se pudo iniciar sesión con Google' };
}
