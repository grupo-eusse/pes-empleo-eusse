'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, buildInviteEmailHtml } from '@/lib/mail';
import type { UserRole } from '@/types/auth';

// Types
export interface ActionResult {
  error?: string;
  success?: boolean;
}

export interface UserProfileData {
  id: string;
  supabase_id: string;
  name: string;
  email: string;
  user_role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserInviteData {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  accepted_at: string | null;
  created_at: string;
  created_by: string;
  creator_name?: string;
}

// Helpers
const handleSupabaseError = (error: any, context: string): ActionResult => {
  console.error(`Error in ${context}:`, error);
  return { error: error.message || 'Error inesperado' };
};

const validateSupabaseClient = async () => {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error('Error de configuración del servidor');
  }
  return supabase;
};

const getCurrentUserProfile = async (supabase: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');
  
  const { data: profile } = await supabase
    .from('user_profile')
    .select('id')
    .eq('supabase_id', user.id)
    .single();
    
  if (!profile) throw new Error('Perfil de usuario no encontrado');
  return profile;
};

/**
 * Obtiene todos los usuarios con rol hr o admin
 */
export async function getAdminUsers(): Promise<{ data: UserProfileData[] | null; error?: string }> {
  try {
    const supabase = await validateSupabaseClient();
    
    const { data: profiles, error } = await supabase
      .from('user_profile')
      .select('*')
      .in('user_role', ['hr', 'admin'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    const usersWithEmail: UserProfileData[] = profiles?.map(profile => ({
      id: profile.id,
      supabase_id: profile.supabase_id,
      name: profile.name || 'Sin nombre',
      email: currentUser?.id === profile.supabase_id 
        ? currentUser?.email || '' 
        : `user-${profile.id.slice(0, 8)}@empresa.com`,
      user_role: profile.user_role,
      is_active: profile.is_active,
      created_at: profile.created_at,
    })) || [];

    return { data: usersWithEmail };
  } catch (error) {
    return { data: null, ...handleSupabaseError(error, 'getAdminUsers') };
  }
}

/**
 * Obtiene todas las invitaciones pendientes
 */
export async function getInvites(): Promise<{ data: UserInviteData[] | null; error?: string }> {
  try {
    const supabase = await validateSupabaseClient();

    const { data: invites, error } = await supabase
      .from('user_invite')
      .select('*, creator:created_by (name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mappedInvites: UserInviteData[] = invites?.map(invite => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      token: invite.token,
      accepted_at: invite.accepted_at,
      created_at: invite.created_at,
      created_by: invite.created_by,
      creator_name: invite.creator?.name || 'Sistema',
    })) || [];

    return { data: mappedInvites };
  } catch (error) {
    return { data: null, ...handleSupabaseError(error, 'getInvites') };
  }
}

/**
 * Crea una nueva invitación para un usuario hr o admin
 */
export async function createInvite(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await validateSupabaseClient();
    
    const email = formData.get('email') as string;
    const role = formData.get('role') as UserRole;

    if (!email || !role) {
      return { error: 'Email y rol son requeridos' };
    }

    if (!['hr', 'admin'].includes(role)) {
      return { error: 'El rol debe ser hr o admin' };
    }

    const currentProfile = await getCurrentUserProfile(supabase);

    // Verificar invitación existente
    const { data: existingInvite } = await supabase
      .from('user_invite')
      .select('id')
      .eq('email', email)
      .is('accepted_at', null)
      .single();

    if (existingInvite) {
      return { error: 'Ya existe una invitación pendiente para este email' };
    }

    const { data: inserted, error } = await supabase
      .from('user_invite')
      .insert({ email, role, created_by: currentProfile.id })
      .select('token')
      .single();

    if (error) throw error;

    // Send invite email via Mailgun
    if (inserted?.token) {
      const html = await buildInviteEmailHtml(email, role, inserted.token);
      const mailResult = await sendEmail({
        to: email,
        subject: 'Invitación al Portal de Empleo Eusse',
        html,
      });
      if (!mailResult.success) {
        console.error('Failed to send invite email:', mailResult.error);
      }
    }

    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error, 'createInvite');
  }
}

/**
 * Actualiza el rol de un usuario
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<ActionResult> {
  try {
    const supabase = await validateSupabaseClient();

    if (!['hr', 'admin', 'postulant'].includes(newRole)) {
      return { error: 'Rol inválido' };
    }

    const { error } = await supabase
      .from('user_profile')
      .update({ user_role: newRole })
      .eq('id', userId);

    if (error) throw error;

    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error, 'updateUserRole');
  }
}

/**
 * Activa o desactiva un usuario
 */
export async function toggleUserStatus(userId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const supabase = await validateSupabaseClient();

    const { error } = await supabase
      .from('user_profile')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) throw error;

    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error, 'toggleUserStatus');
  }
}

/**
 * Elimina una invitación
 */
export async function deleteInvite(inviteId: string): Promise<ActionResult> {
  try {
    const supabase = await validateSupabaseClient();

    const { error } = await supabase
      .from('user_invite')
      .delete()
      .eq('id', inviteId);

    if (error) throw error;

    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error, 'deleteInvite');
  }
}

/**
 * Reenvía una invitación (crea una nueva con el mismo email)
 */
export async function resendInvite(inviteId: string): Promise<ActionResult> {
  try {
    const supabase = await validateSupabaseClient();

    // Obtener la invitación original
    const { data: originalInvite, error: fetchError } = await supabase
      .from('user_invite')
      .select('email, role, created_by')
      .eq('id', inviteId)
      .single();

    if (fetchError || !originalInvite) {
      return { error: 'Invitación no encontrada' };
    }

    // Eliminar la invitación anterior y crear una nueva
    await supabase.from('user_invite').delete().eq('id', inviteId);

    const { data: newInvite, error } = await supabase
      .from('user_invite')
      .insert({
        email: originalInvite.email,
        role: originalInvite.role,
        created_by: originalInvite.created_by,
      })
      .select('token')
      .single();

    if (error) throw error;

    // Send invite email via Mailgun
    if (newInvite?.token) {
      const html = await buildInviteEmailHtml(originalInvite.email, originalInvite.role, newInvite.token);
      const mailResult = await sendEmail({
        to: originalInvite.email,
        subject: 'Invitación al Portal de Empleo Eusse',
        html,
      });
      if (!mailResult.success) {
        console.error('Failed to resend invite email:', mailResult.error);
      }
    }

    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error, 'resendInvite');
  }
}
