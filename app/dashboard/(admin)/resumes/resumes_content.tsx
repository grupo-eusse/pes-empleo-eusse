"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { GeneralCvData } from "@/lib/actions/resumes";
import { getGeneralCvs } from "@/lib/actions/resumes";
import ResumeCard from "@/ui/components/resume_card";
import CVPreviewModal from "@/ui/components/jobs/cv_preview_modal";

interface ResumesContentProps {
  initialCvs: GeneralCvData[];
  initialError: string | null;
}

export default function ResumesContent({
  initialCvs,
  initialError,
}: ResumesContentProps) {
  const [cvs, setCvs] = useState<GeneralCvData[]>(initialCvs);
  const [error, setError] = useState<string | null>(initialError);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<{ cvId: number; mimeType: string } | null>(null);

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      const result = await getGeneralCvs();
      if (result.error) {
        setError(result.error);
        setCvs([]);
      } else {
        setError(null);
        setCvs(result.data ?? []);
      }
    });
  }, []);

  const onPreview = (cvId: number, mimeType: string) => {
    setPreview({ cvId, mimeType });
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const matchesText = (cv: GeneralCvData) => {
      if (!term) return true;
      return (
        (cv.candidate?.name?.toLowerCase() ?? "").includes(term) ||
        (cv.bucket?.toLowerCase() ?? "").includes(term) ||
        (cv.talent_pool?.position?.description?.toLowerCase() ?? "").includes(term) ||
        (cv.talent_pool?.location?.name?.toLowerCase() ?? "").includes(term)
      );
    };

    return cvs.filter(matchesText).sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
    });
  }, [search, cvs, sortOrder]);

  return (
    <div className="space-y-6 text-brand-900">
      <section className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full">
          <div className="flex-1 min-w-55">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, posición o ubicación"
              className="w-full rounded-2xl border border-transparent bg-brand-50 px-4 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
            />
          </div>
          <button
            onClick={() => setSearch("")}
            className="rounded-2xl border border-transparent bg-brand-50 px-4 py-2 text-sm text-brand-900 shadow-[0_12px_30px_rgba(0,0,0,0.05)] shrink-0"
          >
            Limpiar
          </button>
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="rounded-2xl bg-brand-400 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 shrink-0"
          >
            {isPending ? "Actualizando..." : "Actualizar"}
          </button>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
            className="rounded-2xl border border-transparent bg-brand-50 px-4 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40 shrink-0"
          >
            <option value="desc">Más recientes primero</option>
            <option value="asc">Más antiguos primero</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-brand-900/70">
          <span>CV visibles: {filtered.length}</span>
          {error && <span className="text-rose-600">Error: {error}</span>}
        </div>
      </section>

      <section className="space-y-4">
        {filtered.map((cv) => (
          <ResumeCard key={cv.id} cv={cv} onPreview={onPreview} />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-brand-200 bg-white p-8 text-center text-sm text-brand-900/70 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
            {error ? "No se pudieron cargar CVs generales." : "No se encontraron CVs generales."}
          </div>
        )}
      </section>

      <CVPreviewModal
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
        cvId={preview?.cvId ?? null}
        cvMimeType={preview?.mimeType}
      />
    </div>
  );
}

