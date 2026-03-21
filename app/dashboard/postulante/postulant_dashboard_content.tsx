"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { UserProfile } from "@/types/auth";
import { updateUserName, deleteAccount } from "@/lib/actions/postulant";
import CVPreviewModal from "@/ui/components/jobs/cv_preview_modal";

// Tipos que coinciden exactamente con la BD
export type ApplicationStatusDB =
  | "received"
  | "in_review"
  | "contacted"
  | "rejected";

export interface JobApplicationWithDetails {
  id: number;
  status: ApplicationStatusDB;
  created_at: string;
  updated_at: string | null;
  status_changed_at: string;
  job: {
    id: number;
    title: string;
    description: string;
    company: {
      id: number;
      name: string;
    };
    location: {
      id: number;
      name: string;
    };
  };
  cv: {
    id: number;
    path: string;
    mime_type: string;
  };
}

export interface CandidateCVGeneral {
  id: number;
  path: string;
  bucket: string;
  mime_type: string;
  file_size_bytes: number;
  created_at: string;
}

// Filter options with DB value + label
const STATUS_OPTIONS: { value: "all" | ApplicationStatusDB; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "received", label: "Recibida" },
  { value: "in_review", label: "En revisión" },
  { value: "contacted", label: "Contactado" },
  { value: "rejected", label: "Rechazada" },
];

const statusLabels: Record<ApplicationStatusDB, string> = Object.fromEntries(
  STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => [o.value, o.label])
) as Record<ApplicationStatusDB, string>;

const statusColors: Record<ApplicationStatusDB, string> = {
  received:
    "border border-transparent bg-white text-brand-700 shadow-[0_4px_18px_rgba(0,0,0,0.06)]",
  in_review:
    "border border-transparent bg-brand-200/40 text-brand-800 shadow-[0_4px_18px_rgba(0,0,0,0.06)]",
  contacted:
    "border border-transparent bg-brand-400/25 text-brand-900 shadow-[0_4px_18px_rgba(0,0,0,0.08)]",
  rejected:
    "border border-transparent bg-white/80 text-brand-600 opacity-80 shadow-[0_4px_18px_rgba(0,0,0,0.04)]",
};

// --- Helpers ---

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

// Delete-modal step configs (steps 1 & 2)
const DELETE_STEPS = [
  {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    iconPath:
      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    title: "¿Eliminar tu cuenta?",
    titleColor: "text-brand-900",
    description:
      "Esta acción eliminará permanentemente tu cuenta, postulaciones y CVs. No podrás recuperarlos.",
    confirmLabel: "Continuar",
    confirmClass: "bg-red-500",
    cancelLabel: "Cancelar",
  },
  {
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    iconPath:
      "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    title: "¿Estás completamente seguro?",
    titleColor: "text-red-700",
    description:
      "Esta es la última oportunidad para cambiar de opinión. Tu información será eliminada de forma permanente.",
    confirmLabel: "Sí, eliminar mi cuenta",
    confirmClass: "bg-red-600",
    cancelLabel: "No, conservar cuenta",
  },
] as const;

// --- Subcomponents ---

// Componente Modal reutilizable
function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-3xl bg-white p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  step,
  onNext,
  onCancel,
}: {
  step: (typeof DELETE_STEPS)[number];
  onNext: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="text-center">
      <div
        className={`w-16 h-16 mx-auto mb-4 rounded-full ${step.iconBg} flex items-center justify-center`}
      >
        <svg
          className={`w-8 h-8 ${step.iconColor}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={step.iconPath}
          />
        </svg>
      </div>
      <h3 className={`text-lg font-semibold ${step.titleColor}`}>
        {step.title}
      </h3>
      <p className="mt-2 text-sm text-brand-600">{step.description}</p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={onNext}
          className={`flex-1 rounded-xl ${step.confirmClass} px-4 py-2.5 text-sm font-semibold text-white`}
        >
          {step.confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl bg-brand-100 px-4 py-2.5 text-sm font-semibold text-brand-700"
        >
          {step.cancelLabel}
        </button>
      </div>
    </div>
  );
}

export default function PostulantDashboardContent({
  profile,
  userEmail,
  applications,
  generalCV,
}: {
  profile: UserProfile;
  userEmail: string;
  applications: JobApplicationWithDetails[];
  generalCV: CandidateCVGeneral | null;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatusDB>("all");

  // Name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(profile.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Delete account flow (0 = closed, 1-3 = steps)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2 | 3>(0);
  const [confirmDeleteName, setConfirmDeleteName] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // CV preview (single state object instead of 3 separate states)
  const [cvPreview, setCvPreview] = useState<{ id: number; mimeType?: string } | null>(null);

  const filteredApplications = useMemo(
    () =>
      statusFilter === "all"
        ? applications
        : applications.filter((a) => a.status === statusFilter),
    [statusFilter, applications]
  );

  const metrics = useMemo(
    () => [
      { label: "Postulaciones activas", value: applications.length },
      { label: "En revisión", value: applications.filter((a) => a.status === "in_review").length },
      { label: "Contactado", value: applications.filter((a) => a.status === "contacted").length },
    ],
    [applications]
  );

  const handleUpdateName = async () => {
    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      setNameError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    setIsUpdatingName(true);
    setNameError(null);
    const fd = new FormData();
    fd.append("name", trimmed);
    const result = await updateUserName(fd);
    if (result.error) setNameError(result.error);
    else setIsEditingName(false);
    setIsUpdatingName(false);
  };

  const resetDeleteFlow = () => {
    setDeleteStep(0);
    setConfirmDeleteName("");
    setDeleteError(null);
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteName !== profile.name) {
      setDeleteError("El nombre no coincide exactamente");
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    const fd = new FormData();
    fd.append("confirmName", confirmDeleteName);
    const result = await deleteAccount(fd);
    if (result.error) {
      setDeleteError(result.error);
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-50 pb-16 text-brand-900">
      <div className="mx-auto max-w-6xl px-4 pt-12">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-transparent bg-white p-8 shadow-[0_25px_70px_rgba(0,0,0,0.06)]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-600">
              Tu espacio como postulante
            </p>
            <h1 className="mt-2 text-3xl font-bold text-brand-900">
              Panel de seguimiento
            </h1>
            <p className="mt-2 text-sm text-brand-900/70">
              Monitorea el estado de tus postulaciones y actualiza tu perfil en Banco de talentos
              cuando lo necesites.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/buscar-empleos"
              className="rounded-2xl border border-transparent bg-brand-50 px-5 py-2 text-sm font-semibold text-brand-900 shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5"
            >
              Buscar nuevas vacantes
            </Link>
            <Link
              href="/aplicar-general"
              className="rounded-2xl border border-transparent bg-brand-400 px-5 py-2 text-sm font-semibold text-brand-50 shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:bg-brand-400/90"
            >
              {generalCV ? "Actualizar perfil en Banco de talentos" : "Registrar en Banco de talentos"}
            </Link>
          </div>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-transparent bg-white p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)]"
            >
              <p className="text-xs uppercase tracking-widest text-brand-900/60">
                {metric.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-brand-900">
                {metric.value.toString()}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-transparent bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-brand-900">
                  Mis postulaciones
                </h2>
                <p className="text-sm text-brand-900/70">
                  Estados de tus aplicaciones.
                </p>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="rounded-2xl border border-transparent bg-brand-50 px-4 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 space-y-4">
              {filteredApplications.map((app) => (
                <article
                  key={app.id}
                  className="rounded-2xl border border-transparent bg-brand-50 p-4 shadow-[0_15px_45px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-brand-600">
                        {app.job.company.name}
                      </p>
                      <h3 className="text-lg font-semibold text-brand-900">
                        {app.job.title}
                      </h3>
                      <p className="text-sm text-brand-900/70">
                        {app.job.location.name}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-4 py-1 text-xs font-semibold ${
                        statusColors[app.status] ??
                        "border border-brand-100 bg-brand-50 text-brand-700"
                      }`}
                    >
                      {statusLabels[app.status]}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4 text-sm text-brand-900/70 sm:grid-cols-2">
                    <div>
                      <p className="text-brand-600">Enviada</p>
                      <p>{formatDate(app.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-brand-600">Última actualización</p>
                      <p>
                        {app.status_changed_at
                          ? formatDate(app.status_changed_at)
                          : "Pendiente"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}

              {filteredApplications.length === 0 && (
                <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-8 text-center text-sm text-brand-900/70 shadow-[0_15px_45px_rgba(0,0,0,0.04)]">
                  {applications.length === 0 ? (
                    <>
                      Aún no tienes postulaciones.{" "}
                      <Link
                        href="/buscar-empleos"
                        className="text-brand-600 font-semibold hover:underline"
                      >
                        ¡Explora las vacantes disponibles!
                      </Link>
                    </>
                  ) : (
                    "No tienes postulaciones con el filtro seleccionado."
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
              <h3 className="text-lg font-semibold text-brand-900">
                Banco de talentos
              </h3>
              {generalCV ? (
                <>
                  <p className="mt-2 text-sm text-brand-900/70">
                    Subido el: {formatDate(generalCV.created_at)}
                  </p>
                  <p className="mt-1 text-sm text-brand-900/70">
                    Tamaño: {(generalCV.file_size_bytes / 1024).toFixed(1)} KB
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() =>
                        setCvPreview({ id: generalCV.id, mimeType: generalCV.mime_type })
                      }
                      className="flex-1 rounded-2xl border border-transparent bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-900 shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5"
                    >
                      Previsualizar
                    </button>
                    <Link
                      href="/aplicar-general"
                      className="flex-1 rounded-2xl border border-transparent bg-brand-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 text-center"
                    >
                      Actualizar perfil
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-brand-900/70">
                    Aún no estás registrado en Banco de talentos. Hazlo para que te
                    consideremos en futuras vacantes.
                  </p>
                  <Link
                    href="/aplicar-general"
                    className="mt-4 block w-full rounded-2xl border border-transparent bg-brand-400 px-4 py-2 text-sm font-semibold text-white text-center shadow-[0_12px_32px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5"
                  >
                    Registrar perfil
                  </Link>
                </>
              )}
            </div>

            <div className="rounded-3xl border border-transparent bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
              <h3 className="text-lg font-semibold text-brand-900">
                Mis datos
              </h3>
              <div className="mt-4 space-y-4 text-sm text-brand-900/80">
                <div>
                  <p className="text-brand-600">Nombre</p>
                  {isEditingName ? (
                    <div className="mt-1 space-y-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
                      />
                      {nameError && (
                        <p className="text-xs text-red-600">{nameError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateName}
                          disabled={isUpdatingName}
                          className="flex-1 rounded-xl bg-brand-400 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {isUpdatingName ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingName(false);
                            setNewName(profile.name);
                            setNameError(null);
                          }}
                          className="flex-1 rounded-xl bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {profile.name || "Sin nombre registrado"}
                      </p>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-brand-600">Correo</p>
                  <p className="font-medium">{userEmail}</p>
                </div>
                <div>
                  <p className="text-brand-600">Cuenta desde</p>
                  <p className="font-medium">
                    {formatDate(profile.created_at)}
                  </p>
                </div>

                <div className="pt-4 border-t border-brand-100">
                  <button
                    onClick={() => setDeleteStep(1)}
                    className="w-full rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                  >
                    Eliminar mi cuenta
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>

      {/* Delete modals - Steps 1 & 2 (data-driven) */}
      {DELETE_STEPS.map((step, i) => (
        <Modal
          key={i}
          isOpen={deleteStep === ((i + 1) as 1 | 2)}
          onClose={resetDeleteFlow}
        >
          <DeleteConfirmModal
            step={step}
            onNext={() => setDeleteStep((i + 2) as 2 | 3)}
            onCancel={resetDeleteFlow}
          />
        </Modal>
      ))}

      {/* Delete modal - Step 3: Name confirmation */}
      <Modal isOpen={deleteStep === 3} onClose={resetDeleteFlow}>
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-700 text-center">
            Confirma escribiendo tu nombre
          </h3>
          <p className="mt-2 text-sm text-brand-600 text-center">
            Para confirmar la eliminación, escribe tu nombre completo
            exactamente como aparece:
          </p>
          <p className="mt-2 text-center font-semibold text-brand-900 bg-brand-50 px-3 py-2 rounded-xl">
            {profile.name || "Sin nombre"}
          </p>

          <input
            type="text"
            value={confirmDeleteName}
            onChange={(e) => setConfirmDeleteName(e.target.value)}
            placeholder="Escribe tu nombre completo"
            className="mt-4 w-full rounded-xl border border-red-200 bg-red-50/30 px-3 py-2.5 text-brand-900 outline-none focus:ring-2 focus:ring-red-400/40"
          />

          {deleteError && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
              {deleteError}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting || confirmDeleteName !== profile.name}
              className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Eliminando..." : "Eliminar permanentemente"}
            </button>
            <button
              onClick={resetDeleteFlow}
              className="rounded-xl bg-brand-100 px-4 py-2.5 text-sm font-semibold text-brand-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* CV Preview modal */}
      <CVPreviewModal
        isOpen={!!cvPreview}
        onClose={() => setCvPreview(null)}
        cvId={cvPreview?.id ?? null}
        cvMimeType={cvPreview?.mimeType}
      />
    </main>
  );
}
