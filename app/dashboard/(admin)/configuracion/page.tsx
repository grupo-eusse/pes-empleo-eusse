import { getCurrentUser } from '@/lib/supabase/server';
import {
  getAdminUsers,
  getInvites,
  type UserInviteData,
  type UserProfileData,
} from '@/lib/actions/roles';
import {
  getCompanies,
  getLocations,
  getPositions,
  type CompanyData,
  type LocationData,
  type PositionData,
} from '@/lib/actions/config';
import ConfiguracionContent from './configuracion_content';

export default async function ConfiguracionDashboardPage() {
  const { profile } = await getCurrentUser();

  if (!profile) {
    return (
      <div className="rounded-3xl border border-transparent bg-white p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.06)]">
        <p className="text-brand-900/70">No se pudo verificar la sesion actual.</p>
      </div>
    );
  }

  let initialUsers: UserProfileData[] = [];
  let initialInvites: UserInviteData[] = [];
  let initialCompanies: CompanyData[] = [];
  let initialLocations: LocationData[] = [];
  let initialPositions: PositionData[] = [];

  try {
    const [usersResult, invitesResult, companiesResult, locationsResult, positionsResult] =
      await Promise.all([
        getAdminUsers(),
        getInvites(),
        getCompanies(),
        getLocations(),
        getPositions(),
      ]);

    initialUsers = usersResult.data || [];
    initialInvites = invitesResult.data || [];
    initialCompanies = companiesResult.data || [];
    initialLocations = locationsResult.data || [];
    initialPositions = positionsResult.data || [];
  } catch {
    return (
      <div className="rounded-3xl border border-transparent bg-white p-8 shadow-[0_25px_70px_rgba(0,0,0,0.06)] text-center">
        <p className="text-brand-900/70">Error al cargar la configuracion. Intenta recargar la pagina.</p>
      </div>
    );
  }

  return (
    <ConfiguracionContent
      initialUsers={initialUsers}
      initialInvites={initialInvites}
      initialCompanies={initialCompanies}
      initialLocations={initialLocations}
      initialPositions={initialPositions}
      currentUserProfileId={profile.id}
    />
  );
}
