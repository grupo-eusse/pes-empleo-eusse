"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import type {
  ApplicationData,
  AnswerData,
} from "@/lib/actions/applications";
import type { ApplicationNoteData } from "@/lib/application_note_types";
import {
  updateApplicationStatus,
  addApplicationNote,
  deleteApplicationNote,
} from "@/lib/actions/applications";
import { insertNoteIntoTree, removeNoteFromTree } from "@/lib/application_notes";
import { APPLICATION_STATUS_MAP, type ApplicationStatus } from "@/lib/constants";
import { PROVINCES, CANTONS } from "@/lib/locations";
import { Skeleton } from "@/ui/components/skeleton";

// Estilos de estado
const statusStyles: Record<ApplicationStatus, string> = {
  received: "bg-brand-50 text-brand-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]",
  in_review: "bg-brand-200/40 text-brand-900 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]",
  contacted: "bg-brand-400/25 text-brand-900 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]",
  rejected: "bg-rose-50 text-rose-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]",
};

const SELECT_OPTIONS: ApplicationStatus[] = ["received", "in_review", "contacted", "rejected"];

function useApplicationStatus(
  appId: number,
  currentStatus: ApplicationStatus,
  onSuccess: (nextStatus: ApplicationStatus, statusChangedAt: string) => void
) {
  const [localStatus, setLocalStatus] = useState<ApplicationStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    setLocalStatus(newStatus);
    startTransition(async () => {
      const result = await updateApplicationStatus(appId, newStatus);
      if (result.error) {
        setLocalStatus(currentStatus);
        alert(result.error);
      } else {
        onSuccess(
          result.data?.status ?? newStatus,
          result.data?.status_changed_at ?? new Date().toISOString()
        );
      }
    });
  };

  return { localStatus, setLocalStatus, isPending, handleStatusChange };
}

// Componente de nota individual
function NoteItem({
  note,
  applicationId,
  depth = 0,
  onReply,
  onDelete,
  currentUserProfileId,
}: {
  note: ApplicationNoteData;
  applicationId: number;
  depth?: number;
  onReply: (noteId: number) => void;
  onDelete: (noteId: number) => void;
  currentUserProfileId: string;
}) {
  const isAuthor = note.author_id === currentUserProfileId;

  return (
    <div className={clsx("border-l-2 border-brand-100 pl-4", depth > 0 && "ml-4")}>
      <div className="rounded-2xl bg-brand-50/50 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-brand-900">
              {note.author?.name || "Usuario"}
            </span>
            <span className="text-xs text-brand-900/50">
              {new Date(note.created_at).toLocaleDateString("es-CR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onReply(note.id)}
              className="text-xs text-brand-600 hover:text-brand-800"
            >
              Responder
            </button>
            {isAuthor && (
              <button
                onClick={() => onDelete(note.id)}
                className="text-xs text-rose-600 hover:text-rose-800"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm text-brand-900/80">{note.body}</p>
      </div>
      {note.replies && note.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {note.replies.map((reply) => (
            <NoteItem
              key={reply.id}
              note={reply}
              applicationId={applicationId}
              depth={depth + 1}
              onReply={onReply}
              onDelete={onDelete}
              currentUserProfileId={currentUserProfileId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Componente de hilo de notas
function NotesThread({
  notes,
  applicationId,
  currentUserProfileId,
  onNotesUpdated,
}: {
  notes: ApplicationNoteData[];
  applicationId: number;
  currentUserProfileId: string;
  onNotesUpdated: (applicationId: number, notes: ApplicationNoteData[]) => void;
}) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [newNote, setNewNote] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    startTransition(async () => {
      const result = await addApplicationNote(applicationId, newNote.trim(), replyingTo || undefined);
      if (result.error) {
        alert(result.error);
        return;
      }

      const addedNote = result.data;
      if (addedNote) {
        setLocalNotes((current) => {
          const nextNotes = insertNoteIntoTree(current, addedNote);
          onNotesUpdated(applicationId, nextNotes);
          return nextNotes;
        });
      }

      setNewNote("");
      setReplyingTo(null);
    });
  };

  const handleDelete = async (noteId: number) => {
    if (!confirm("¿Eliminar esta nota?")) return;
    startTransition(async () => {
      const result = await deleteApplicationNote(noteId);
      if (result.error) {
        alert(result.error);
        return;
      }

      setLocalNotes((current) => {
        const nextNotes = removeNoteFromTree(current, noteId);
        onNotesUpdated(applicationId, nextNotes);
        return nextNotes;
      });
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-brand-900">Notas internas ({localNotes.length})</h4>

      {localNotes.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {localNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              applicationId={applicationId}
              onReply={(id) => setReplyingTo(id)}
              onDelete={handleDelete}
              currentUserProfileId={currentUserProfileId}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-brand-900/60">Sin notas aún</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        {replyingTo && (
          <div className="flex items-center justify-between bg-brand-100 rounded-xl px-3 py-1 text-xs">
            <span>Respondiendo a nota #{replyingTo}</span>
            <button type="button" onClick={() => setReplyingTo(null)} className="text-brand-600">
              Cancelar
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Agregá una nota para el equipo"
            disabled={isPending}
            className="flex-1 rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending || !newNote.trim()}
            className="rounded-xl bg-brand-400 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Componente de respuestas a preguntas
function QuestionsAnswers({ answers }: { answers: AnswerData[] }) {
  if (!answers || answers.length === 0) {
    return (
      <p className="text-sm text-brand-900/60">El candidato no respondió preguntas adicionales.</p>
    );
  }

  return (
    <div className="space-y-3">

      <div className="space-y-3">
        {answers.map((answer) => (
          <div key={answer.id} className="rounded-2xl bg-brand-50/50 p-4">
            <p className="text-xs font-medium text-brand-600 uppercase tracking-wide">
              {answer.question?.description || "Pregunta"}
            </p>
            <p className="mt-1 text-sm text-brand-900">{answer.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ApplicationCardProps {
  app: ApplicationData;
  onPreview: (id: string, cvId: number, mimeType: string) => void;
  onStatusUpdated: (appId: number, status: ApplicationStatus, statusChangedAt: string) => void;
  onOpenDetails: (app: ApplicationData) => void;
}

export default function ApplicationCard({
  app,
  onPreview,
  onStatusUpdated,
  onOpenDetails,
}: ApplicationCardProps) {
  const { localStatus, isPending, handleStatusChange } = useApplicationStatus(
    app.id,
    app.status,
    (nextStatus, statusChangedAt) => onStatusUpdated(app.id, nextStatus, statusChangedAt)
  );

  return (
    <article className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-brand-600">
            {app.job?.title || "Sin puesto"}
          </p>
          <h3 className="text-xl font-semibold text-brand-900">
            {app.candidate?.name || "Sin nombre"}
          </h3>
          <p className="text-sm text-brand-900/70">
            {app.job?.company_data?.name} · {app.job?.location_data?.name}
          </p>
        </div>
        <span
          className={clsx("rounded-full px-4 py-1 text-xs font-semibold", statusStyles[localStatus])}
        >
          {APPLICATION_STATUS_MAP[localStatus]}
        </span>
      </header>

      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
        <div className="rounded-2xl border border-transparent bg-brand-50 p-4">
          <p className="text-xs uppercase tracking-widest text-brand-600">Empresa</p>
          <p className="font-semibold text-brand-900">{app.job?.company_data?.name || "N/A"}</p>
          <p className="text-brand-900/70">{app.job?.location_data?.name || "N/A"}</p>
        </div>
        <div className="rounded-2xl border border-transparent bg-brand-50 p-4">
          <p className="text-xs uppercase tracking-widest text-brand-600">Aplicación</p>
          <p className="font-semibold text-brand-900">
            {new Date(app.created_at).toLocaleDateString("es-CR")}
          </p>
          <p className="text-brand-900/70">CV: {app.cv?.mime_type === "application/pdf" ? "PDF" : "Word"}</p>
        </div>
        <div className="rounded-2xl border border-transparent bg-brand-50 p-4">
          <p className="text-xs uppercase tracking-widest text-brand-600">Último cambio</p>
          <p className="font-semibold text-brand-900">
            {new Date(app.status_changed_at).toLocaleDateString("es-CR")}
          </p>
          <p className="text-brand-900/70">{app.notes?.length || 0} notas</p>
        </div>
      </div>

      <footer className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => onOpenDetails(app)}
          className="rounded-2xl border border-transparent bg-white px-4 py-2 text-sm text-brand-900 shadow-[0_12px_30px_rgba(0,0,0,0.05)]"
        >
          Ver detalles
        </button>
        <button
          onClick={() => app.cv && onPreview(app.id.toString(), app.cv.id, app.cv.mime_type)}
          className="rounded-2xl bg-brand-400 px-4 py-2 text-sm font-semibold text-brand-50 shadow-[0_20px_55px_rgba(0,0,0,0.12)]"
        >
          Previsualizar CV
        </button>
        <div className="flex-1" />
        <label className="text-xs text-brand-900/70">Estado:</label>
        <select
          value={localStatus}
          onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
          disabled={isPending}
          className="rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50"
        >
          {SELECT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {APPLICATION_STATUS_MAP[option]}
            </option>
          ))}
        </select>
      </footer>
    </article>
  );
}

function formatDate(value?: string | null, opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short" }) {
  if (!value) return "N/D";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/D";
  return parsed.toLocaleDateString("es-CR", opts);
}

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  const formatted = typeof value === "number" ? value.toString() : value;
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-brand-600">{label}</p>
      <p className="mt-1 text-sm font-semibold text-brand-900">{formatted || "N/D"}</p>
    </div>
  );
}

function DetailItemsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="mt-3 h-5 w-28" />
        </div>
      ))}
    </div>
  );
}

function DetailSectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="mt-3 h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

function getProvinceName(code?: number) {
  const province = PROVINCES.find((p) => p.code === code);
  return province?.name || (code ? `Código ${code}` : "N/D");
}

function getCantonName(cantonCode?: number) {
  if (!cantonCode) return "N/D";
  const entries = Object.values(CANTONS).flat();
  const canton = entries.find((c) => c.code === cantonCode);
  return canton?.name || `Código ${cantonCode}`;
}

export function ApplicationDetailsModal({
  app,
  isOpen,
  onClose,
  onStatusUpdated,
  onNotesUpdated,
  currentUserProfileId,
  isLoading = false,
  error,
}: {
  app: ApplicationData | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: (appId: number, status: ApplicationStatus, statusChangedAt: string) => void;
  onNotesUpdated: (appId: number, notes: ApplicationNoteData[]) => void;
  currentUserProfileId: string;
  isLoading?: boolean;
  error?: string | null;
}) {
  const { localStatus, setLocalStatus, isPending, handleStatusChange } = useApplicationStatus(
    app?.id ?? 0,
    app?.status ?? 'received',
    (nextStatus, statusChangedAt) => {
      if (app?.id) {
        onStatusUpdated(app.id, nextStatus, statusChangedAt);
      }
    }
  );

  useEffect(() => {
    if (app) setLocalStatus(app.status);
  }, [app, setLocalStatus]);

  const provinceName = useMemo(() => getProvinceName(app?.residence_province_code), [app?.residence_province_code]);
  const cantonName = useMemo(() => getCantonName(app?.residence_canton_code), [app?.residence_canton_code]);

  if (!isOpen || !app) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-brand-100 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-600">
              {app.job?.title || "Puesto"}
            </p>
            <h3 className="text-2xl font-semibold text-brand-900">{app.candidate?.name || app.applicant_full_name}</h3>
            <p className="text-sm text-brand-900/70">
              {app.job?.company_data?.name} · {app.job?.location_data?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5">
              <span className="text-xs font-semibold text-brand-800">Estado:</span>
              <select
                value={localStatus}
                onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                disabled={isPending}
                className="rounded-xl border border-transparent bg-white px-2 py-1 text-xs font-semibold text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50"
              >
                {SELECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {APPLICATION_STATUS_MAP[option]}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800 hover:bg-brand-100"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-6 space-y-6">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {isLoading && <DetailItemsSkeleton />}

          <div className="grid gap-4 md:grid-cols-3">
            <DetailItem label="Aplicación" value={formatDate(app.created_at, { year: "numeric", month: "short", day: "2-digit" })} />
            <DetailItem label="Último cambio" value={formatDate(app.status_changed_at, { year: "numeric", month: "short", day: "2-digit" })} />
            <DetailItem label="CV" value={app.cv?.mime_type === "application/pdf" ? "PDF" : app.cv?.mime_type ? "Word" : "N/D"} />
          </div>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-brand-900">Datos del postulante</h4>
              <DetailItem label="Nombre completo" value={app.applicant_full_name || app.candidate?.name} />
              <DetailItem label="Identificación" value={app.applicant_id_number} />
              <DetailItem label="Teléfono" value={app.applicant_phone} />
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-brand-900">Residencia</h4>
              <DetailItem label="Provincia" value={provinceName} />
              <DetailItem label="Cantón" value={cantonName} />
              <DetailItem label="Dirección" value={app.residence_detail || "No especificada"} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-brand-900">Experiencia laboral</h4>
              <span className="text-xs text-brand-900/60">
                {isLoading ? "..." : `${app.work_experience?.length || 0} registros`}
              </span>
            </div>
            {isLoading ? (
              <DetailSectionSkeleton />
            ) : app.work_experience && app.work_experience.length > 0 ? (
              <div className="space-y-3">
                {app.work_experience.map((exp) => (
                  <div key={exp.id} className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-brand-900">{exp.job_title}</p>
                        <p className="text-sm text-brand-900/70">{exp.company_name}</p>
                      </div>
                      <p className="text-xs text-brand-800">
                        {formatDate(exp.start_date, { year: "numeric", month: "short" })} -{" "}
                        {exp.is_current ? "Actual" : formatDate(exp.end_date, { year: "numeric", month: "short" })}
                      </p>
                    </div>
                    {exp.responsibilities && (
                      <p className="mt-2 text-sm text-brand-900/80">{exp.responsibilities}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-brand-900/60">Sin experiencia registrada.</p>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-brand-900">Educación</h4>
              <span className="text-xs text-brand-900/60">
                {isLoading ? "..." : `${app.education?.length || 0} registros`}
              </span>
            </div>
            {isLoading ? (
              <DetailSectionSkeleton />
            ) : app.education && app.education.length > 0 ? (
              <div className="space-y-3">
                {app.education.map((edu) => (
                  <div key={edu.id} className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-brand-900">{edu.institution_name}</p>
                        <p className="text-sm text-brand-900/70">{edu.degree_level}</p>
                        {edu.field_of_study && (
                          <p className="text-sm text-brand-900/70">Área: {edu.field_of_study}</p>
                        )}
                      </div>
                      <p className="text-xs text-brand-800">
                        {formatDate(edu.start_date, { year: "numeric", month: "short" })} -{" "}
                        {edu.is_in_progress ? "En curso" : formatDate(edu.end_date, { year: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-brand-900/60">Sin educación registrada.</p>
            )}
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-brand-900">Preguntas adicionales</h4>
            {isLoading ? (
              <DetailSectionSkeleton rows={3} />
            ) : (
              <QuestionsAnswers answers={app.answers || []} />
            )}
          </section>

          <section className="space-y-3">
            {isLoading ? (
              <DetailSectionSkeleton rows={2} />
            ) : (
              <NotesThread
                notes={app.notes || []}
                applicationId={app.id}
                currentUserProfileId={currentUserProfileId}
                onNotesUpdated={onNotesUpdated}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
