"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import JobCardRecruiterReal from "@/ui/components/jobs/job_card_recruiter";
import JobFormModal from "@/ui/components/jobs/job_form_model";
import { fetchJobsDataClient } from "@/lib/actions/jobs.client";
import type { JobData, JobStatus, CompanyData, LocationData } from "@/types/jobs";
import { Skeleton } from "@/ui/components/skeleton";

const statusOptions: (JobStatus | "all")[] = ["all", "draft", "pending", "active", "paused", "closed"];

const STATUS_DISPLAY: Record<JobStatus | "all", string> = {
  all: "Todos",
  draft: "Borrador",
  pending: "Pendiente",
  active: "Activo",
  paused: "Pausado",
  closed: "Cerrado",
};

function RecruiterJobsSkeleton() {
  return (
    <div className="space-y-6 text-brand-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-3">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-11 w-36" />
      </div>

      <section className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.06)]">
        <div className="grid gap-4 md:grid-cols-5">
          <Skeleton className="h-11 w-full md:col-span-2" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </section>

      <section className="space-y-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)]"
          >
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="mt-3 h-8 w-2/3" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <div className="mt-5 flex flex-wrap gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function RecruiterJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [showClosed, setShowClosed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const result = await fetchJobsDataClient();

      if (cancelled) {
        return;
      }

      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setJobs(result.jobs || []);
        setCompanies(result.companies || []);
        setLocations(result.locations || []);
      }

      setIsLoading(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    startTransition(() => {
      setRefreshKey((current) => current + 1);
    });
  }, []);

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (!showClosed && job.status === "closed") return false;
      const matchesTerm =
        !term ||
        job.title.toLowerCase().includes(term) ||
        job.company_data?.name?.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term);
      const matchesStatus = status === "all" || job.status === status;
      const matchesCompany = companyFilter === "all" || job.company.toString() === companyFilter;
      const matchesLocation = locationFilter === "all" || job.location.toString() === locationFilter;
      return matchesTerm && matchesStatus && matchesCompany && matchesLocation;
    });
  }, [search, status, companyFilter, locationFilter, jobs, showClosed]);

  const statusOptionsFiltered = useMemo(
    () => (showClosed ? statusOptions : statusOptions.filter((opt) => opt !== "closed")),
    [showClosed]
  );

  const handleEdit = (job: JobData) => {
    setEditingJob(job);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingJob(null);
    setShowModal(true);
  };

  const handleViewApplicants = (jobId: number) => {
    router.push(`/dashboard/aplicaciones?job=${jobId}`);
  };

  if (isLoading) {
    return <RecruiterJobsSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-rose-50 p-6 text-rose-700">
        Error al cargar las ofertas: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-brand-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Ofertas de trabajo</h2>
          <p className="text-sm text-brand-900/70">Gestiona vacantes activas, programadas y en borrador.</p>
        </div>
        <button
          onClick={handleCreate}
          className="rounded-2xl border border-transparent bg-brand-400 px-5 py-2 text-sm font-semibold text-brand-50 shadow-[0_20px_55px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90"
        >
          Agregar oferta
        </button>
      </div>

      <section className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.06)]">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="md:col-span-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscá por título, empresa o descripción"
              className="w-full rounded-2xl border border-transparent bg-brand-50 px-4 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus | "all")}
            className="rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
          >
            {statusOptionsFiltered.map((option) => (
              <option key={option} value={option}>
                {STATUS_DISPLAY[option]}
              </option>
            ))}
          </select>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
          >
            <option value="all">Todas las empresas</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
          >
            <option value="all">Todas las ubicaciones</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-brand-900/70">
          <button
            onClick={() => {
              setSearch("");
              setStatus("all");
              setCompanyFilter("all");
              setLocationFilter("all");
            }}
            className="rounded-full border border-transparent bg-brand-50 px-4 py-1 shadow-[0_10px_28px_rgba(0,0,0,0.05)]"
          >
            Limpiar filtros
          </button>
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="rounded-full border border-transparent bg-brand-50 px-4 py-1 shadow-[0_10px_28px_rgba(0,0,0,0.05)] disabled:opacity-50"
          >
            {isPending ? "Actualizando..." : "Actualizar"}
          </button>
          <span>Ofertas: {filteredJobs.length}</span>
          <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-brand-900">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(e) => {
                if (!e.target.checked && status === "closed") {
                  setStatus("all");
                }
                setShowClosed(e.target.checked);
              }}
              className="h-4 w-4 rounded border-brand-300 text-brand-500 focus:ring-brand-400"
            />
            Mostrar puestos cerrados
          </label>
        </div>
      </section>

      <section className="space-y-4">
        {filteredJobs.map((job) => (
          <JobCardRecruiterReal
            key={job.id}
            job={job}
            onEdit={handleEdit}
            onViewApplicants={handleViewApplicants}
            onRefresh={handleRefresh}
          />
        ))}
        {filteredJobs.length === 0 && (
          <div className="rounded-3xl border border-dashed border-brand-200 bg-white p-8 text-center text-sm text-brand-900/70 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
            No hay ofertas que cumplan con los filtros seleccionados.
          </div>
        )}
      </section>

      {/* Modal de creación/edición */}
      <JobFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingJob(null);
        }}
        onSuccess={handleRefresh}
        job={editingJob}
        companies={companies}
        locations={locations}
      />
    </div>
  );
}
