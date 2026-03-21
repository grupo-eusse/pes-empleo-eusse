"use client";

import { useState, useEffect, useTransition } from "react";
import type { JobData, JobStatus, CompanyData, LocationData, QuestionFormat } from "@/types/jobs";
import { createJobClient, updateJobClient, createCompanyClient, createLocationClient } from "@/lib/actions/jobs.client";

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  job?: JobData | null; // null = crear, objeto = editar
  companies: CompanyData[];
  locations: LocationData[];
}

type QuestionFormItem = {
  id?: number;
  description: string;
  localId: string;
  expected_format: QuestionFormat;
};

const QUESTION_FORMAT_OPTIONS: { value: QuestionFormat; label: string }[] = [
  { value: "text", label: "Respuesta libre" },
  { value: "int", label: "Número entero" },
  { value: "decimal", label: "Número con decimales" },
  { value: "boolean", label: "Sí / No" },
  { value: "date", label: "Fecha" },
];

export default function JobFormModal({
  isOpen,
  onClose,
  onSuccess,
  job,
  companies,
  locations,
}: JobFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario
  const [title, setTitle] = useState(job?.title || "");
  const [description, setDescription] = useState(job?.description || "");
  const [companyId, setCompanyId] = useState(job?.company?.toString() || "");
  const [locationId, setLocationId] = useState(job?.location?.toString() || "");
  const [status, setStatus] = useState<JobStatus>(job?.status || "draft");
  const [activateAt, setActivateAt] = useState(job?.activate_at?.slice(0, 10) || "");
  const [questions, setQuestions] = useState<QuestionFormItem[]>(
    job?.questions?.map((q) => ({
      id: q.id,
      description: q.description,
      expected_format: q.expected_format || "text",
      localId: `existing-${q.id}`
    })) || []
  );

  // Estados para crear nuevos items
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newLocationName, setNewLocationName] = useState("");

  // Listas locales actualizables
  const [localCompanies, setLocalCompanies] = useState<CompanyData[]>(companies);
  const [localLocations, setLocalLocations] = useState<LocationData[]>(locations);

  useEffect(() => {
    setTitle(job?.title || "");
    setDescription(job?.description || "");
    setCompanyId(job?.company?.toString() || "");
    setLocationId(job?.location?.toString() || "");
    setStatus(job?.status || "draft");
    // Keep ISO date (YYYY-MM-DD) for native date picker
    setActivateAt(job?.activate_at?.slice(0, 10) || "");
    setQuestions(
      job?.questions?.map((q) => ({
        id: q.id,
        description: q.description,
        expected_format: q.expected_format || "text",
        localId: `existing-${q.id}`,
      })) || []
    );
    // Reset helpers
    setShowNewCompany(false);
    setShowNewLocation(false);
    setNewCompanyName("");
    setNewLocationName("");
  }, [job]);

  useEffect(() => {
    setLocalCompanies(companies);
  }, [companies]);

  useEffect(() => {
    setLocalLocations(locations);
  }, [locations]);

  const createLocalId = () => `q-${Math.random().toString(16).slice(2)}-${Date.now()}`;

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, { localId: createLocalId(), description: "", expected_format: "text" }]);
  };

  const handleQuestionChange = (localId: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.localId === localId ? { ...q, description: value } : q))
    );
  };

  const handleRemoveQuestion = (localId: string) => {
    setQuestions((prev) => prev.filter((q) => q.localId !== localId));
  };

  const handleFormatChange = (localId: string, value: QuestionFormat) => {
    setQuestions((prev) =>
      prev.map((q) => (q.localId === localId ? { ...q, expected_format: value } : q))
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !companyId || !locationId) {
      setError("Todos los campos son requeridos");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("company", companyId);
    formData.append("location", locationId);
    formData.append("status", status);
    if (activateAt) formData.append("activate_at", activateAt);

    const questionPayload = questions
      .map((q) => ({
        id: q.id,
        description: q.description.trim(),
        expected_format: q.expected_format
      }))
      .filter((q) => q.description.length > 0);
    formData.append("questions", JSON.stringify(questionPayload));

    startTransition(async () => {
      let result;
      if (job) {
        result = await updateJobClient(job.id, Object.fromEntries(formData.entries()));
      } else {
        result = await createJobClient(Object.fromEntries(formData.entries()));
      }

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
        onClose();
      }
    });
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    startTransition(async () => {
      const result = await createCompanyClient(newCompanyName.trim());
      if (result.data) {
        setLocalCompanies([...localCompanies, result.data]);
        setCompanyId(result.data.id.toString());
        setNewCompanyName("");
        setShowNewCompany(false);
      }
    });
  };

  const handleCreateLocation = async () => {
    if (!newLocationName.trim()) return;
    startTransition(async () => {
      const result = await createLocationClient(newLocationName.trim());
      if (result.data) {
        setLocalLocations([...localLocations, result.data]);
        setLocationId(result.data.id.toString());
        setNewLocationName("");
        setShowNewLocation(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-brand-900">
            {job ? "Editar oferta" : "Nueva oferta"}
          </h2>
          <button
            onClick={onClose}
            className="text-brand-900/60 hover:text-brand-900"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-900 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              className="w-full rounded-xl border border-brand-200 px-4 py-2 outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50"
              placeholder="Escribí el título del puesto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-900 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              rows={4}
              className="w-full rounded-xl border border-brand-200 px-4 py-2 outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50"
              placeholder="Detallá las responsabilidades y requisitos del puesto"
            />
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-brand-900">Preguntas para el postulante</p>

              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="rounded-xl bg-brand-400 px-3 py-2 text-xs font-semibold text-white shadow disabled:opacity-50"
                disabled={isPending}
              >
                Agregar pregunta
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {questions.length === 0 && (
                <p className="text-sm text-brand-900/60">
                  No hay preguntas adicionales. Agrega las que quieras que respondan los candidatos.
                </p>
              )}
              {questions.map((q, index) => (
                <div key={q.localId} className="rounded-xl border border-brand-100 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-brand-700">Pregunta {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(q.localId)}
                      className="text-xs text-rose-600 hover:text-rose-700 disabled:opacity-50"
                      disabled={isPending}
                    >
                      Quitar
                    </button>
                  </div>
                  <textarea
                    value={q.description}
                    onChange={(e) => handleQuestionChange(q.localId, e.target.value)}
                    rows={2}
                    disabled={isPending}
                    className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50"
                    placeholder="Escribí la pregunta que debe responder la persona candidata"
                  />
                  <label className="mt-2 block text-xs font-semibold text-brand-700">
                    Tipo de respuesta
                    <select
                      value={q.expected_format}
                      onChange={(e) => handleFormatChange(q.localId, e.target.value as QuestionFormat)}
                      disabled={isPending}
                      className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50"
                      required
                    >
                      {QUESTION_FORMAT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Empresa */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-1">Empresa</label>
              {showNewCompany ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    disabled={isPending}
                    className="flex-1 rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none"
                    placeholder="Escribí el nombre de la empresa"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCompany}
                    disabled={isPending}
                    className="rounded-xl bg-brand-400 px-3 py-2 text-sm text-white"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCompany(false)}
                    className="rounded-xl bg-brand-50 px-3 py-2 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    disabled={isPending}
                    className="flex-1 rounded-xl border border-brand-200 px-4 py-2 outline-none disabled:opacity-50"
                  >
                    <option value="">Seleccionar...</option>
                    {localCompanies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCompany(true)}
                    className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700"
                  >
                    
                  </button>
                </div>
              )}
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-1">Ubicación</label>
              {showNewLocation ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    disabled={isPending}
                    className="flex-1 rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none"
                    placeholder="Escribí el nombre de la ubicación"
                  />
                  <button
                    type="button"
                    onClick={handleCreateLocation}
                    disabled={isPending}
                    className="rounded-xl bg-brand-400 px-3 py-2 text-sm text-white"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewLocation(false)}
                    className="rounded-xl bg-brand-50 px-3 py-2 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    disabled={isPending}
                    className="flex-1 rounded-xl border border-brand-200 px-4 py-2 outline-none disabled:opacity-50"
                  >
                    <option value="">Seleccionar...</option>
                    {localLocations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewLocation(true)}
                    className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700"
                  >
                    
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              {/* Estado */}
              <label className="block text-sm font-medium text-brand-900 mb-1">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                disabled={isPending}
                className="w-full rounded-xl border border-brand-200 px-4 py-2 outline-none disabled:opacity-50"
              >
                <option value="draft">Borrador</option>
                <option value="pending">Pendiente</option>
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-900 mb-1">
                Fecha de activación
              </label>
              <input
                type="date"
                value={activateAt}
                onChange={(e) => setActivateAt(e.target.value)}
                disabled={isPending}
                className="w-full rounded-xl border border-brand-200 px-4 py-2 outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl bg-brand-50 px-6 py-2 text-sm font-semibold text-brand-900 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-brand-400 px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isPending ? "Guardando..." : job ? "Guardar cambios" : "Crear oferta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
