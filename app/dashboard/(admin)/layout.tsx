import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import TabLink from "@/ui/components/dashboard/tab_link";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentUser();

  // Verificar autenticación (si Supabase está configurado)
  if (!user || !profile) {
    redirect('/login');
  }

  // Verificar que el usuario tenga rol HR o Admin
  if (profile.user_role !== 'hr' && profile.user_role !== 'admin') {
    redirect('/dashboard/postulante');
  }

  const isAdmin = profile.user_role === 'admin';

  return (
    <main className="min-h-screen bg-brand-50 pb-12 text-brand-900">
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-6 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-600">Panel RRHH</p>
        <h1 className="mt-2 text-4xl font-bold text-brand-900">Administración centralizada</h1>
        <p className="mt-2 text-brand-900/70">
          Publica ofertas, revisa postulaciones, gestiona el Banco de talentos y controla permisos internos.
        </p>
      </section>

      <nav className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-transparent bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <TabLink href="/dashboard/puestos">Gestión de ofertas</TabLink>
          <TabLink href="/dashboard/aplicaciones">Postulaciones</TabLink>
          <TabLink href="/dashboard/resumes">Banco de talentos</TabLink>
          {isAdmin && (
            <>
              <TabLink href="/dashboard/configuracion">Configuración</TabLink>
              <TabLink href="/dashboard/metricas">Métricas</TabLink>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-6">{children}</section>
    </main>
  );
}
