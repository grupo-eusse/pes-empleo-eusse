'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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
