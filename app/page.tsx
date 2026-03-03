import Link from 'next/link';
import CareersSection from '@/ui/components/home/career_section';
import { WhyChooseUs } from '@/ui/components/home/why_choose_us';
import EmployeeTestimonials from '@/ui/components/home/employee_testimonials';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function Home() {
  const { user, profile } = await getCurrentUser();
  const isPostulant = profile?.user_role === 'postulant';

  return (
    <div className="bg-brand-50 text-brand-900">
      <section className="bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 py-20 text-brand-50">
        <div className="mx-auto max-w-6xl px-4 h-[80vh] flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Grupo Empresarial Eusse</p>
          <h1 className="mt-3 text-4xl font-bold text-brand-50 sm:text-5xl">
            Tu próximo paso profesional comienza con nosotros
          </h1>
          <p className="mt-4 text-lg text-brand-50/80">
            Explora vacantes, postúlate en minutos y haz seguimiento de cada etapa junto al equipo de
            talento de Grupo Empresarial Eusse.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
            <Link
              href="/buscar-empleos"
              className="rounded-md border border-transparent bg-brand-400 px-6 py-3 text-brand-50 shadow-[0_18px_35px_rgba(6,58,74,0.45)] transition hover:bg-brand-400/90"
            >
              Ver ofertas públicas
            </Link>
            {user && isPostulant && (
              <Link
                href="/dashboard/postulante"
                className="rounded-md border border-transparent px-6 py-3 text-brand-50 shadow-[0_18px_35px_rgba(0,0,0,0.25)] hover:bg-brand-50/10"
              >
                Ir a mi panel
              </Link>
            )}
            {!user && (
              <Link
                href="/login"
                className="rounded-md border border-transparent px-6 py-3 text-brand-50 shadow-[0_18px_35px_rgba(0,0,0,0.25)] hover:bg-brand-50/10"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </section>

      <CareersSection />
      <WhyChooseUs />
      <EmployeeTestimonials />
    </div>
  );
}
