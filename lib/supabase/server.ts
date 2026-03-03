import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignorado cuando se llama desde un Server Component (sin acceso a cookies)
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const supabase = await createClient();
  if (!supabase) return { user: null, profile: null };

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, profile: null };

  const { data: profile, error: profileError } = await supabase
    .from('user_profile')
    .select('*')
    .eq('supabase_id', user.id)
    .single();

  if (profileError) console.error('Error fetching user profile:', profileError);

  return { user, profile: profile ?? null };
}

export async function checkUserRole(allowedRoles: string[]) {
  const { profile } = await getCurrentUser();
  return !!profile?.is_active && allowedRoles.includes(profile.user_role);
}
