'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapAdminProfilesWithEmails, type AdminProfileRecord } from '@/lib/actions/role_user_mappers';
import { buildSupabaseInviteOptions, isAdminInviteRole } from '@/lib/invite_utils';
import type { UserRole } from '@/types/auth';

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

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error inesperado';
}

const handleSupabaseError = (error: unknown, context: string): ActionResult => {
  console.error(`Error in ${context}:`, error);
  return { error: getErrorMessage(error) };
};

const validateSupabaseClient = async (): Promise<SupabaseClient> => {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error('Error de configuracion del servidor');
  }
  return supabase;
};

const getCurrentUserProfile = async (supabase: SupabaseClient) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const { data: profile } = await supabase
    .from('user_profile')
    .select('id')
    .eq('supabase_id', user.id)
    .single();

  if (!profile) {
    throw new Error('Perfil de usuario no encontrado');
  }

  return profile;
};

export async function getAdminUsers(): Promise<{ data: UserProfileData[] | null; error?: string }> {
  try {
    const supabase = await validateSupabaseClient();
    const adminClient = createAdminClient();

    const { data: profiles, error } = await supabase
      .from('user_profile')
      .select('*')
      .in('user_role', ['hr', 'admin'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    const authEmailsById = new Map<string, string>();

    if (adminClient) {
      const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });

      if (authError) {
        console.error('Error fetching auth users:', authError);
      } else {
        for (const authUser of authUsers.users) {
          if (authUser.id && authUser.email) {
            authEmailsById.set(authUser.id, authUser.email);
          }
        }
      }
    }

    const usersWithEmail: UserProfileData[] = mapAdminProfilesWithEmails(
      (profiles ?? []) as AdminProfileRecord[],
      currentUser?.id,
      currentUser?.email,
      authEmailsById,
    );

    return { data: usersWithEmail };
  } catch (error) {
    return { data: null, ...handleSupabaseError(error, 'getAdminUsers') };
  }
}

export async function getInvites(): Promise<{ data: UserInviteData[] | null; error?: string }> {
  try {
    const supabase = await validateSupabaseClient();

    const { data: invites, error } = await supabase
      .from('user_invite')
      .select('*, creator:created_by (name)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const mappedInvites: UserInviteData[] = invites?.map((invite) => ({
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

export async function createInvite(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await validateSupabaseClient();
    const adminClient = createAdminClient();

    const email = formData.get('email') as string;
    const role = formData.get('role') as UserRole;

    if (!email || !role) {
      return { error: 'Email y rol son requeridos' };
    }

    if (!isAdminInviteRole(role)) {
      return { error: 'El rol debe ser hr o admin' };
    }

    if (!adminClient) {
      return { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY para enviar invitaciones' };
    }

    const currentProfile = await getCurrentUserProfile(supabase);

    const { data: existingInvite } = await supabase
      .from('user_invite')
      .select('id')
      .eq('email', email)
      .is('accepted_at', null)
      .single();

    if (existingInvite) {
      return { error: 'Ya existe una invitacion pendiente para este email' };
    }

    const { data: inserted, error } = await supabase
      .from('user_invite')
      .insert({ email, role, created_by: currentProfile.id })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    const inviteOptions = buildSupabaseInviteOptions(SITE_URL, role);
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, inviteOptions);

    if (inviteError) {
      if (inserted?.id) {
        await supabase.from('user_invite').delete().eq('id', inserted.id);
      }
      return { error: inviteError.message };
    }

    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error, 'createInvite');
  }
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<ActionResult> {
  try {
    const supabase = await validateSupabaseClient();

    if (!['hr', 'admin', 'postulant'].includes(newRole)) {
      return { error: 'Rol invalido' };
    }

    const { error } = await supabase
      .from('user_profile')
      .update({ user_role: newRole })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error, 'updateUserRole');
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const supabase = await validateSupabaseClient();

    const { error } = await supabase
      .from('user_profile')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error, 'toggleUserStatus');
  }
}

export async function deleteInvite(inviteId: string): Promise<ActionResult> {
  try {
    const supabase = await validateSupabaseClient();

    const { error } = await supabase
      .from('user_invite')
      .delete()
      .eq('id', inviteId);

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error, 'deleteInvite');
  }
}

export async function resendInvite(inviteId: string): Promise<ActionResult> {
  try {
    const supabase = await validateSupabaseClient();
    const adminClient = createAdminClient();

    if (!adminClient) {
      return { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY para reenviar invitaciones' };
    }

    const { data: originalInvite, error: fetchError } = await supabase
      .from('user_invite')
      .select('email, role')
      .eq('id', inviteId)
      .single();

    if (fetchError || !originalInvite) {
      return { error: 'Invitacion no encontrada' };
    }

    if (!isAdminInviteRole(originalInvite.role)) {
      return { error: 'El rol debe ser hr o admin' };
    }

    const inviteOptions = buildSupabaseInviteOptions(SITE_URL, originalInvite.role);
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      originalInvite.email,
      inviteOptions,
    );

    if (inviteError) {
      return { error: inviteError.message };
    }

    revalidatePath('/dashboard/configuracion');
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error, 'resendInvite');
  }
}
