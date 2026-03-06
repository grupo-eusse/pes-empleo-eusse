"use client";

import { useState } from "react";
import type { GeneralCvData } from "@/lib/actions/resumes";
import { getCVDownloadUrl } from "@/lib/actions/postulant";

interface ResumeCardProps {
  cv: GeneralCvData;
  onPreview: (cvId: number, mimeType: string) => void;
}

export default function ResumeCard({ cv, onPreview }: ResumeCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileType = cv.mime_type === "application/pdf" ? "PDF" : "DOC";
  const receivedAt = new Date(cv.created_at).toLocaleDateString("es-CR");
  const position = cv.talent_pool?.position?.description ?? "Sin posición";
  const location = cv.talent_pool?.location?.name ?? "Sin ubicación";

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);
    const result = await getCVDownloadUrl(cv.id);
    setDownloading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      window.open(result.url, "_blank");
    }
  };

  return (
    <article className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5">
      <header className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <h3 className="text-lg font-semibold text-brand-900">{cv.candidate?.name ?? "Sin nombre"}</h3>
        <div className="flex flex-wrap items-center gap-3 text-brand-900/70">
          <span className="font-semibold text-brand-900">{fileType}</span>
          <span aria-hidden>·</span>
          <span>Recibido: {receivedAt}</span>
        </div>
      </header>

      <div className="mt-4 grid gap-4 sm:grid-cols-3 sm:items-stretch">
        <div className="rounded-2xl border border-transparent bg-brand-50 p-4">
          <p className="text-xs uppercase tracking-widest text-brand-600">Posición</p>
          <p className="font-semibold text-brand-900">{position}</p>
        </div>
        <div className="rounded-2xl border border-transparent bg-brand-50 p-4">
          <p className="text-xs uppercase tracking-widest text-brand-600">Ubicación</p>
          <p className="font-semibold text-brand-900">{location}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-transparent bg-brand-50 p-4">
          <button
            onClick={() => onPreview(cv.id, cv.mime_type)}
            className="rounded-xl bg-brand-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
          >
            Previsualizar CV
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] disabled:opacity-50"
          >
            {downloading ? "Descargando..." : "Descargar CV"}
          </button>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      </div>
    </article>
  );
}
