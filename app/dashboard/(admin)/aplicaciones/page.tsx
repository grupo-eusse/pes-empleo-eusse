"use client";

import { useCallback, useEffect, useState } from "react";
import ApplicationCardReal, { ApplicationDetailsModal } from "@/ui/components/aplicaction_card";
import CVPreviewModal from "@/ui/components/jobs/cv_preview_modal";
import {
  getApplications,
  type ApplicationData,
  getApplicationById,
} from "@/lib/actions/applications";
import {
  updateApplicationNotesInList,
  updateApplicationNotesInRecord,
  updateApplicationStatusInList,
  updateApplicationStatusInRecord,
} from "@/lib/application_collection";
import { APPLICATION_STATUS_MAP, type ApplicationStatus } from "@/lib/constants";
import { Skeleton } from "@/ui/components/skeleton";

const statusOptions: (ApplicationStatus | "all")[] = [
  "all",
  "received",
  "in_review",
  "contacted",
  "rejected",
];

const PAGE_SIZE = 10;

function ApplicationsSkeleton() {
  return (
    <div className="space-y-6 text-brand-900">
      <section className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.06)]">
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-11 w-full md:col-span-2" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-44 rounded-full" />
        </div>
      </section>

      <section className="space-y-4">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)]"
          >
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="mt-3 h-7 w-2/3" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
            <div className="mt-5 flex flex-wrap gap-3">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
        <Skeleton className="h-4 w-44 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "all">("all");
  const [selectedAppSummary, setSelectedAppSummary] = useState<ApplicationData | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = useState<ApplicationData | null>(null);

  // Estados para preview de CV
  const [showCVPreview, setShowCVPreview] = useState(false);
  const [previewCvId, setPreviewCvId] = useState<number | null>(null);
  const [previewCvMimeType, setPreviewCvMimeType] = useState<string | undefined>(undefined);

  // ID del perfil del usuario actual (simplificado - debería venir del contexto)
  const currentUserProfileId = "";

  const fetchApplicationDetails = useCallback(async (appId: number) => {
    setIsLoadingDetails(true);
    setDetailsError(null);
    const result = await getApplicationById(appId);
    if (result.error || !result.data) {
      setDetailsError(result.error || "No se pudieron cargar los detalles");
    } else {
      setSelectedAppDetail(result.data);
    }
    setIsLoadingDetails(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsRefreshing(true);
      const result = await getApplications({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        status,
        search,
      });

      if (cancelled) {
        return;
      }

      if (result.error) {
        setError(result.error);
        setApplications([]);
        setTotal(0);
      } else {
        setError(null);
        setApplications(result.data || []);
        setTotal(result.total || 0);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [page, refreshKey, search, status]);

  const handleStatusUpdated = useCallback(
    (appId: number, nextStatus: ApplicationStatus, statusChangedAt: string) => {
      setApplications((current) =>
        updateApplicationStatusInList(current, appId, nextStatus, statusChangedAt)
      );
      setSelectedAppSummary((current) =>
        updateApplicationStatusInRecord(current, appId, nextStatus, statusChangedAt)
      );
      setSelectedAppDetail((current) =>
        updateApplicationStatusInRecord(current, appId, nextStatus, statusChangedAt)
      );
    },
    []
  );

  const handleNotesUpdated = useCallback((appId: number, notes: ApplicationData["notes"] = []) => {
    setApplications((current) => updateApplicationNotesInList(current, appId, notes));
    setSelectedAppSummary((current) => updateApplicationNotesInRecord(current, appId, notes));
    setSelectedAppDetail((current) => updateApplicationNotesInRecord(current, appId, notes));
  }, []);

  const handleRefresh = () => {
    setRefreshKey((current) => current + 1);
    const selectedId = selectedAppDetail?.id ?? selectedAppSummary?.id;
    if (selectedId) {
      void fetchApplicationDetails(selectedId);
    }
  };

  const onPreview = (id: string, cvId: number, mimeType: string) => {
    setPreviewCvId(cvId);
    setPreviewCvMimeType(mimeType);
    setShowCVPreview(true);
  };

  const handleOpenDetails = async (app: ApplicationData) => {
    setSelectedAppSummary(app);
    setSelectedAppDetail(null);
    setDetailsError(null);
    void fetchApplicationDetails(app.id);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  if (isLoading) {
    return <ApplicationsSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-rose-50 p-6 text-rose-700">
        Error al cargar las postulaciones: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-brand-900">
      <section className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.06)]">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscá por candidato, puesto o empresa"
              className="w-full rounded-2xl border border-transparent bg-brand-50 px-4 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ApplicationStatus | "all");
              setPage(1);
            }}
            className="rounded-2xl border border-transparent bg-brand-50 px-4 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
          >
            <option value="all">Todos los estados</option>
            {statusOptions.filter((s) => s !== "all").map((option) => (
              <option key={option} value={option}>
                {APPLICATION_STATUS_MAP[option as ApplicationStatus]}
              </option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-2xl bg-brand-400 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-brand-900/70">
          <button
            onClick={() => {
              setSearch("");
              setStatus("all");
              setPage(1);
            }}
            className="rounded-full border border-transparent bg-brand-50 px-4 py-1 shadow-[0_10px_28px_rgba(0,0,0,0.05)]"
          >
            Limpiar filtros
          </button>
          <span>
            Página {page} de {totalPages} · {total} resultados
          </span>
        </div>
      </section>

      <section className="space-y-4">
        {applications.map((app) => (
          <ApplicationCardReal
            key={app.id}
            app={app}
            onPreview={onPreview}
            onStatusUpdated={handleStatusUpdated}
            onOpenDetails={handleOpenDetails}
          />
        ))}
        {applications.length === 0 && (
          <div className="rounded-3xl border border-dashed border-brand-200 bg-white p-8 text-center text-sm text-brand-900/70 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
            No se encontraron postulaciones.
          </div>
        )}
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm text-brand-900 shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
        <span>
          Mostrando {(page - 1) * PAGE_SIZE + 1} -{" "}
          {Math.min(page * PAGE_SIZE, total)} de {total}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!canPrev) {
                return;
              }
              setPage((p) => Math.max(1, p - 1));
            }}
            disabled={!canPrev || isRefreshing}
            className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-1 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => {
              if (!canNext) {
                return;
              }
              setPage((p) => p + 1);
            }}
            disabled={!canNext || isRefreshing}
            className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-1 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Modal para preview de CV */}
      <CVPreviewModal
        isOpen={showCVPreview}
        onClose={() => {
          setShowCVPreview(false);
          setPreviewCvId(null);
          setPreviewCvMimeType(undefined);
        }}
        cvId={previewCvId}
        cvMimeType={previewCvMimeType}
      />

      <ApplicationDetailsModal
        app={selectedAppDetail || selectedAppSummary}
        isOpen={!!selectedAppSummary}
        onClose={() => {
          setSelectedAppSummary(null);
          setSelectedAppDetail(null);
          setDetailsError(null);
          setIsLoadingDetails(false);
        }}
        onStatusUpdated={handleStatusUpdated}
        onNotesUpdated={handleNotesUpdated}
        currentUserProfileId={currentUserProfileId}
        isLoading={isLoadingDetails}
        error={detailsError}
      />
    </div>
  );
}
