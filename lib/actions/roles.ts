'use server';

import { revalidatePath } from 'next/cache';
import {
  buildAdminUserCreatePayload,
  parseAdminUserCreationForm,
} from '@/lib/actions/admin_user_creation';
import { mapAdminProfilesWithEmails, type AdminProfileRecord } from '@/lib/actions/role_user_mappers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/auth';

export interface UserProfileData {
  id: string;
  supabase_id: string;
  name: string;
  email: string;
  user_role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface ActionResult {
  error?: string;
  success?: boolean;
  user?: UserProfileData;
}

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

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
    throw new Error('Error de configuración del servidor');
  }

  return supabase;
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

export async function createAdminUser(formData: FormData): Promise<ActionResult> {
  try {
    const adminClient = createAdminClient();
    const parsed = parseAdminUserCreationForm(formData);

    if ('error' in parsed) {
      return { error: parsed.error };
    }

    if (!adminClient) {
      return { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY para crear usuarios administrativos' };
    }

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser(
      buildAdminUserCreatePayload(parsed),
    );

    if (createUserError) {
      return { error: createUserError.message };
    }

    const authUser = createdUser.user;
    if (!authUser) {
      return { error: 'No se pudo crear el usuario en autenticación' };
    }

    const { data: existingProfile, error: existingProfileError } = await adminClient
      .from('user_profile')
      .select('id')
      .eq('supabase_id', authUser.id)
      .maybeSingle();

    if (existingProfileError) {
      await adminClient.auth.admin.deleteUser(authUser.id);
      return { error: existingProfileError.message };
    }

    const profilePayload = {
      name: parsed.fullName,
      user_role: parsed.role,
      is_active: true,
    };

    const profileQuery = existingProfile
      ? adminClient
          .from('user_profile')
          .update(profilePayload)
          .eq('id', existingProfile.id)
      : adminClient
          .from('user_profile')
          .insert({
            supabase_id: authUser.id,
            ...profilePayload,
          });

    const { data: profileRecord, error: profileError } = await profileQuery
      .select('id, created_at, user_role, is_active')
      .single();

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authUser.id);
      return { error: profileError.message };
    }

    revalidatePath('/dashboard/configuracion');

    return {
      success: true,
      user: {
        id: profileRecord.id,
        supabase_id: authUser.id,
        name: parsed.fullName,
        email: parsed.email,
        user_role: profileRecord.user_role,
        is_active: profileRecord.is_active,
        created_at: profileRecord.created_at,
      },
    };
  } catch (error) {
    return handleSupabaseError(error, 'createAdminUser');
  }
}

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
