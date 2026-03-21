"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import JobCard from "@/ui/components/jobs/job_card";
import JobModal from "@/ui/components/jobs/job_modal";
import type { JobData, CompanyData, LocationData } from "@/types/jobs";
import type { UserRole } from "@/types/auth";
import { Skeleton } from "@/ui/components/skeleton";

const sortOptions = [
  { value: "recientes", label: "Más recientes" },
  { value: "antiguos", label: "Más antiguos" },
] as const;

interface JobsPageContentProps {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  jobs: JobData[];
  companies: CompanyData[];
  locations: LocationData[];
}

export default function JobsPageContent({ isAuthenticated, userRole, jobs, companies, locations }: JobsPageContentProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState<string>("Todas las ubicaciones");
  const [company, setCompany] = useState<string>("Todas las empresas");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]["value"]>("recientes");
  const [openJob, setOpenJob] = useState<JobData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;
  const [hasGeneralCv, setHasGeneralCv] = useState<boolean | null>(null);

  // Determinar permisos
  const isPostulant = isAuthenticated && userRole === 'postulant';
  const isHrOrAdmin = isAuthenticated && (userRole === 'hr' || userRole === 'admin');

  useEffect(() => {
    const checkGeneralCv = async () => {
      if (!isPostulant) {
        setHasGeneralCv(false);
        return;
      }
      try {
        const res = await fetch("/api/general-cv", { cache: "no-store" });
        const json = await res.json();
        setHasGeneralCv(!!json?.cv);
      } catch (err) {
        console.error("Error checking general CV:", err);
        setHasGeneralCv(false);
      }
    };
    checkGeneralCv();
  }, [isPostulant]);

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return jobs
      .filter((job) => job.status === "active")
      .filter((job) => {
        const companyName = job.company_data?.name ?? "";
        const locationName = job.location_data?.name ?? "";

        const matchesSearch =
          !term ||
          job.title.toLowerCase().includes(term) ||
          companyName.toLowerCase().includes(term) ||
          job.description.toLowerCase().includes(term);

        const matchesLocation =
          location === "Todas las ubicaciones" || locationName === location;

        const matchesCompany =
          company === "Todas las empresas" || companyName === company;

        return matchesSearch && matchesLocation && matchesCompany;
      })
      .sort((a, b) => {
      if (sortBy === "recientes") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "antiguos") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return 0;
    });
  }, [search, location, company, sortBy, jobs]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  const handleApply = (jobId: number) => {
    setOpenJob(null);
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/aplicar/${jobId}`);
    } else if (isPostulant) {
      router.push(`/aplicar/${jobId}`);
    }
    // Si es HR/Admin, no hacer nada (el botón está deshabilitado)
  };

  const clearFilters = () => {
    setSearch("");
    setLocation("Todas las ubicaciones");
    setCompany("Todas las empresas");
    setSortBy("recientes");
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-brand-50 pb-16 text-brand-900">
      {/* Hero */}
      <section className="bg-linear-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">
              Grupo Empresarial Eusse
            </p>
            <h1 className="mt-3 text-4xl font-bold text-brand-900 sm:text-5xl">
              Encuentra la oportunidad que impulse tu siguiente paso
            </h1>


          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="mx-auto mt-10 max-w-6xl px-4">
        <div className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.06)]">
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-brand-900/60">Buscar</label>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscá por puesto, empresa o palabra clave"
                className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none ring-1 ring-brand-100 focus:ring-2 focus:ring-brand-400/50"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-brand-900/60">Ubicación</label>
              <select
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none ring-1 ring-brand-100 focus:ring-2 focus:ring-brand-400/50"
              >
                {["Todas las ubicaciones", ...locations.map((l) => l.name)].map((loc) => (
                  <option key={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-brand-900/60">Empresa</label>
              <select
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none ring-1 ring-brand-100 focus:ring-2 focus:ring-brand-400/50"
              >
                {["Todas las empresas", ...companies.map((c) => c.name)].map((comp) => (
                  <option key={comp}>{comp}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-brand-900/60">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as (typeof sortOptions)[number]["value"]);
                  setCurrentPage(1);
                }}
                className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none ring-1 ring-brand-100 focus:ring-2 focus:ring-brand-400/50"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={clearFilters}
                className="w-full rounded-2xl border border-transparent bg-brand-50 px-4 py-2 text-sm text-brand-900/70 shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:bg-brand-50/80"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* List */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-brand-900">
              Vacantes
            </h2>
          </div>

        </header>

        <div className="space-y-5">
          {paginatedJobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              onOpen={setOpenJob}
              isAuthenticated={isAuthenticated}
              userRole={userRole}
            />
          ))}

          {filteredJobs.length === 0 && (
            <div className="rounded-3xl border border-dashed border-brand-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
              <p className="text-lg font-medium text-brand-900">
                No encontramos vacantes con los filtros seleccionados.
              </p>
              <p className="mt-2 text-sm text-brand-900/60">
                Intenta con otra ubicación o envía tu CV general para futuras oportunidades.
              </p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {filteredJobs.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-xl border border-transparent bg-white px-4 py-2 text-sm font-semibold text-brand-900 shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Mostrar solo algunas páginas alrededor de la actual
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        currentPage === page
                          ? "bg-brand-400 text-white shadow-[0_12px_30px_rgba(0,0,0,0.15)]"
                          : "bg-white text-brand-900 shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-brand-900/50">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-xl border border-transparent bg-white px-4 py-2 text-sm font-semibold text-brand-900 shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Siguiente
            </button>
          </div>
        )}
      </section>

      {/* CV General Section */}
      <section className="mx-auto mt-16 max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border border-transparent bg-brand-900 text-brand-50 shadow-[0_15px_50px_rgba(0,0,0,0.35)]">
          <div className="border-b border-white/10 px-6 py-6">
            <p className="text-2xl font-semibold">¿No encontraste lo que buscabas?</p>
            <p className="mt-2 text-xl font-semibold">Forma parte de nuestro banco de talentos</p>
            <p className="mt-3 text-sm text-brand-50/70">
              Te consideramos para vacantes futuras durante 3 meses manteniendo tu CV actualizado.
            </p>
          </div>
          <div className="px-6 py-6">
            {isPostulant && hasGeneralCv === null ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full bg-white/20" />
                <Skeleton className="h-4 w-3/4 bg-white/20" />
              </div>
            ) : isPostulant && hasGeneralCv === false ? (
              <Link
                href="/aplicar-general"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-transparent bg-brand-400 px-5 py-3 text-base font-semibold text-brand-50 shadow-[0_25px_60px_rgba(0,0,0,0.2)] transition hover:bg-brand-400/90"
              >
                Registra tu curriculum
              </Link>
            ) : isPostulant && hasGeneralCv === true ? (
              <div className="rounded-2xl border border-transparent bg-brand-800/80 px-5 py-3 text-center text-sm font-semibold text-brand-50 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                Ya registraste tu CV general. Actualízalo desde tu dashboard si lo necesitas.
              </div>
            ) : isHrOrAdmin ? (
              <button
                disabled
                className="inline-flex w-full items-center justify-center rounded-2xl border border-transparent bg-brand-700 px-5 py-3 text-base font-semibold text-brand-50/50 cursor-not-allowed"
              >
                No disponible para tu rol
              </button>
            ) : (
              <Link
                href="/login?returnUrl=/aplicar-general"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-transparent bg-brand-400 px-5 py-3 text-base font-semibold text-brand-50 shadow-[0_25px_60px_rgba(0,0,0,0.2)] transition hover:bg-brand-400/90"
              >
                Iniciar sesión para registrar tu curriculum
              </Link>
            )}
          </div>
        </div>
      </section>

      <JobModal
        job={openJob}
        open={!!openJob}
        onClose={() => setOpenJob(null)}
        onApply={handleApply}
        userRole={userRole}
      />
    </main>
  );
}
