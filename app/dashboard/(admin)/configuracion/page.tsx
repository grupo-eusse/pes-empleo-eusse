import { getCurrentUser } from '@/lib/supabase/server';
import {
  getAdminUsers,
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
        <p className="text-brand-900/70">No se pudo verificar la sesión actual.</p>
      </div>
    );
  }

  let initialUsers: UserProfileData[] = [];
  let initialCompanies: CompanyData[] = [];
  let initialLocations: LocationData[] = [];
  let initialPositions: PositionData[] = [];

  try {
    const [usersResult, companiesResult, locationsResult, positionsResult] =
      await Promise.all([
        getAdminUsers(),
        getCompanies(),
        getLocations(),
        getPositions(),
      ]);

    initialUsers = usersResult.data || [];
    initialCompanies = companiesResult.data || [];
    initialLocations = locationsResult.data || [];
    initialPositions = positionsResult.data || [];
  } catch {
    return (
      <div className="rounded-3xl border border-transparent bg-white p-8 shadow-[0_25px_70px_rgba(0,0,0,0.06)] text-center">
        <p className="text-brand-900/70">Error al cargar la configuración. Intenta recargar la página.</p>
      </div>
    );
  }

  return (
    <ConfiguracionContent
      initialUsers={initialUsers}
      initialCompanies={initialCompanies}
      initialLocations={initialLocations}
      initialPositions={initialPositions}
      currentUserProfileId={profile.id}
    />
  );
}
