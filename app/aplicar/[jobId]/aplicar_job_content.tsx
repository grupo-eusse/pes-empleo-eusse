'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { getQuestionFieldConfig, validateQuestionAnswer } from '@/lib/questions';
import { uploadJobSpecificCV, submitJobApplication, saveJobAnswers } from '@/lib/actions/postulant';
import { PROVINCES, CANTONS } from '@/lib/locations';
import type { JobData } from '@/types/jobs';

interface Props {
  job: JobData;
  userName: string;
  userEmail: string;
}

interface EducationEntry {
  institutionName: string;
  degreeLevel: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isInProgress: boolean;
}

interface WorkEntry {
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  responsibilities: string;
}

type Status = 'form' | 'loading' | 'success' | 'error';

const DEGREE_LEVELS = [
  'Primaria',
  'Secundaria',
  'Técnico',
  'Diplomado',
  'Bachillerato universitario',
  'Licenciatura',
  'Maestría',
  'Doctorado',
];

export default function AplicarJobContent({ job, userName, userEmail }: Props) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>('form');
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState(userName);
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [cantonCode, setCantonCode] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [useGeneralCV, setUseGeneralCV] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);

  // Education
  const [education, setEducation] = useState<EducationEntry[]>([]);
  // Work experience
  const [workExperience, setWorkExperience] = useState<WorkEntry[]>([]);

  // Question answers
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const questions = job.questions ?? [];
  const provinceCantons = provinceCode ? (CANTONS[parseInt(provinceCode)] ?? []) : [];
  const loading = status === 'loading' || isPending;

  const addEducation = () => setEducation([...education, { institutionName: '', degreeLevel: '', fieldOfStudy: '', startDate: '', endDate: '', isInProgress: false }]);
  const removeEducation = (i: number) => setEducation(education.filter((_, idx) => idx !== i));
  const updateEducation = (i: number, field: keyof EducationEntry, value: string | boolean) => {
    const updated = [...education];
    updated[i] = { ...updated[i], [field]: value };
    setEducation(updated);
  };

  const addWork = () => setWorkExperience([...workExperience, { companyName: '', jobTitle: '', startDate: '', endDate: '', isCurrent: false, responsibilities: '' }]);
  const removeWork = (i: number) => setWorkExperience(workExperience.filter((_, idx) => idx !== i));
  const updateWork = (i: number, field: keyof WorkEntry, value: string | boolean) => {
    const updated = [...workExperience];
    updated[i] = { ...updated[i], [field]: value };
    setWorkExperience(updated);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStatus('loading');

    startTransition(async () => {
      try {
        let cvId: string | undefined;

        // Upload CV if not using general
        if (!useGeneralCV) {
          if (!cvFile) {
            setError('Selecciona un archivo de CV');
            setStatus('error');
            return;
          }
          const cvFormData = new FormData();
          cvFormData.append('cv', cvFile);
          const cvResult = await uploadJobSpecificCV(cvFormData);
          if (cvResult.error) {
            setError(cvResult.error);
            setStatus('error');
            return;
          }
          cvId = String(cvResult.cvId);
        }

        // Save answers if any
        if (questions.length > 0 && Object.keys(answers).length > 0) {
          for (const question of questions) {
            const answer = answers[question.id] ?? '';
            const validationError = validateQuestionAnswer(question.expected_format, answer, question.description);
            if (validationError) {
              setError(validationError);
              setStatus('error');
              return;
            }
          }

          const answerFormData = new FormData();
          for (const [qId, val] of Object.entries(answers)) {
            answerFormData.append(`answer_${qId}`, val);
          }
          const answerResult = await saveJobAnswers(answerFormData);
          if (answerResult.error) {
            setError(answerResult.error);
            setStatus('error');
            return;
          }
        }

        // Submit application
        const appFormData = new FormData();
        appFormData.append('jobId', String(job.id));
        appFormData.append('useGeneralCV', String(useGeneralCV));
        if (cvId) appFormData.append('cvId', cvId);
        appFormData.append('fullName', fullName);
        appFormData.append('idNumber', idNumber);
        appFormData.append('phone', phone);
        appFormData.append('provinceCode', provinceCode);
        appFormData.append('cantonCode', cantonCode);
        appFormData.append('addressDetail', addressDetail);
        if (education.length > 0) appFormData.append('education', JSON.stringify(education));
        if (workExperience.length > 0) appFormData.append('workExperience', JSON.stringify(workExperience));

        const result = await submitJobApplication(appFormData);
        if (result.error) {
          setError(result.error);
          setStatus('error');
        } else {
          setStatus('success');
        }
      } catch {
        setError('Error inesperado. Intenta de nuevo.');
        setStatus('error');
      }
    });
  };

  if (status === 'success') {
    return (
      <div className="flex flex-1 items-center justify-center bg-brand-50 px-4 py-8 text-brand-900">
        <div className="w-full max-w-md rounded-2xl border border-transparent bg-white p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.08)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brand-900">¡Postulación enviada!</h1>
          <p className="mt-3 text-brand-900/70">
            Tu postulación a <strong>{job.title}</strong> ha sido recibida. Te notificaremos sobre el estado de tu aplicación.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              href="/buscar-empleos"
              className="inline-flex items-center justify-center rounded-2xl border border-transparent bg-brand-400 px-6 py-3 text-sm font-semibold text-brand-50 shadow-[0_20px_55px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90"
            >
              Ver más vacantes
            </Link>
            <Link
              href="/dashboard/postulante"
              className="inline-flex items-center justify-center rounded-2xl border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-900 transition hover:-translate-y-0.5"
            >
              Mis postulaciones
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const companyName = job.company_data?.name ?? 'Empresa';
  const locationName = job.location_data?.name ?? 'Ubicación';

  return (
    <div className="min-h-screen bg-brand-50 px-4 py-8 text-brand-900">
      <div className="mx-auto max-w-3xl">
        {/* Job Summary */}
        <div className="mb-6 rounded-2xl border border-transparent bg-brand-900 p-6 text-brand-50 shadow-[0_25px_70px_rgba(0,0,0,0.15)]">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-50/60">{companyName} · {locationName}</p>
          <h1 className="mt-2 text-2xl font-bold">{job.title}</h1>
          <p className="mt-2 text-sm text-brand-50/70 line-clamp-2">{job.description}</p>
        </div>

        {/* Application Form */}
        <div className="rounded-3xl border border-transparent bg-white p-8 shadow-[0_35px_90px_rgba(0,0,0,0.08)]">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-600">Postulación</p>
          <h2 className="mt-2 text-2xl font-bold text-brand-900">Completa tu información</h2>

          {(status === 'error' || error) && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Personal Info */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-brand-900/80">Información personal</legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-brand-900/70">
                  Nombre completo
                  <input required minLength={5} value={fullName} onChange={e => setFullName(e.target.value)} disabled={loading}
                    className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40" />
                </label>
                <label className="block text-sm text-brand-900/70">
                  Correo electrónico
                  <input readOnly value={userEmail} className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50/60 px-3 py-2 text-brand-900/60 outline-none cursor-not-allowed" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-brand-900/70">
                  Número de cédula
                  <input required value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="Escribí tu número de cédula" disabled={loading}
                    className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40" />
                </label>
                <label className="block text-sm text-brand-900/70">
                  Teléfono
                  <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="Escribí tu número de teléfono" disabled={loading}
                    className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-brand-900/70">
                  Provincia
                  <select required value={provinceCode} onChange={e => { setProvinceCode(e.target.value); setCantonCode(''); }} disabled={loading}
                    className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40">
                    <option value="">Selecciona</option>
                    {PROVINCES.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm text-brand-900/70">
                  Cantón
                  <select required value={cantonCode} onChange={e => setCantonCode(e.target.value)} disabled={loading || !provinceCode}
                    className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40">
                    <option value="">Selecciona</option>
                    {provinceCantons.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </label>
              </div>

              <label className="block text-sm text-brand-900/70">
                Detalle de dirección (opcional)
                <input value={addressDetail} onChange={e => setAddressDetail(e.target.value)} placeholder="Agregá barrio, calle o una referencia" disabled={loading}
                  className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40" />
              </label>
            </fieldset>

            {/* Education */}
            <fieldset className="space-y-4">
              <div className="flex items-center justify-between">
                <legend className="text-sm font-semibold text-brand-900/80">Educación (opcional)</legend>
                <button type="button" onClick={addEducation} disabled={loading}
                  className="rounded-xl bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-100">
                  + Agregar
                </button>
              </div>
              {education.map((edu, i) => (
                <div key={i} className="space-y-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
                  <div className="flex justify-end">
                    <button type="button" onClick={() => removeEducation(i)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input placeholder="Escribí el nombre de la institución" value={edu.institutionName} onChange={e => updateEducation(i, 'institutionName', e.target.value)} disabled={loading}
                      className="w-full rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40" />
                    <select value={edu.degreeLevel} onChange={e => updateEducation(i, 'degreeLevel', e.target.value)} disabled={loading}
                      className="w-full rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40">
                      <option value="">Nivel</option>
                      {DEGREE_LEVELS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <input placeholder="Escribí tu área de estudio" value={edu.fieldOfStudy} onChange={e => updateEducation(i, 'fieldOfStudy', e.target.value)} disabled={loading}
                    className="w-full rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input type="date" placeholder="Fecha de inicio" value={edu.startDate} onChange={e => updateEducation(i, 'startDate', e.target.value)} disabled={loading}
                      className="w-full rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40" />
                    <input type="date" placeholder="Fecha de finalización" value={edu.endDate} onChange={e => updateEducation(i, 'endDate', e.target.value)} disabled={loading || edu.isInProgress}
                      className="w-full rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-brand-900/60">
                    <input type="checkbox" checked={edu.isInProgress} onChange={e => updateEducation(i, 'isInProgress', e.target.checked)} />
                    En curso
                  </label>
                </div>
              ))}
            </fieldset>

            {/* Work Experience */}
            <fieldset className="space-y-4">
              <div className="flex items-center justify-between">
                <legend className="text-sm font-semibold text-brand-900/80">Experiencia laboral (opcional)</legend>
                <button type="button" onClick={addWork} disabled={loading}
                  className="rounded-xl bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-100">
                  + Agregar
                </button>
              </div>
              {workExperience.map((work, i) => (
                <div key={i} className="space-y-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
                  <div className="flex justify-end">
                    <button type="button" onClick={() => removeWork(i)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input placeholder="Escribí el nombre de la empresa" required value={work.companyName} onChange={e => updateWork(i, 'companyName', e.target.value)} disabled={loading}
                      className="w-full rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40" />
                    <input placeholder="Escribí el puesto que desempeñaste" required value={work.jobTitle} onChange={e => updateWork(i, 'jobTitle', e.target.value)} disabled={loading}
                      className="w-full rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input type="date" required value={work.startDate} onChange={e => updateWork(i, 'startDate', e.target.value)} disabled={loading}
                      className="w-full rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40" />
                    <input type="date" value={work.endDate} onChange={e => updateWork(i, 'endDate', e.target.value)} disabled={loading || work.isCurrent}
                      className="w-full rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-brand-900/60">
                    <input type="checkbox" checked={work.isCurrent} onChange={e => updateWork(i, 'isCurrent', e.target.checked)} />
                    Trabajo actual
                  </label>
                  <textarea placeholder="Contanos cuáles eran tus responsabilidades" value={work.responsibilities} onChange={e => updateWork(i, 'responsibilities', e.target.value)} disabled={loading}
                    rows={2} className="w-full rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40 resize-none" />
                </div>
              ))}
            </fieldset>

            {/* Questions */}
            {questions.length > 0 && (
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-brand-900/80">Preguntas adicionales</legend>
                {questions.map(q => {
                  const fieldConfig = getQuestionFieldConfig(q.expected_format);

                  return (
                  <label key={q.id} className="block text-sm text-brand-900/70">
                    <span className="block">{q.description}</span>
                    <span className="mt-1 block text-xs font-medium uppercase tracking-[0.2em] text-brand-600/80">
                      Tipo: {fieldConfig.label}
                    </span>
                    {q.expected_format === 'boolean' ? (
                      <select value={answers[q.id] ?? ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} disabled={loading} required
                        className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40">
                        <option value="">Selecciona</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        type={fieldConfig.inputType}
                        inputMode={fieldConfig.inputMode}
                        step={fieldConfig.step}
                        value={answers[q.id] ?? ''}
                        onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                        disabled={loading} required
                        className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
                      />
                    )}
                  </label>
                  );
                })}
              </fieldset>
            )}

            {/* CV Upload */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-brand-900/80">Currículum vítae</legend>
              <label className="flex items-center gap-3 text-sm text-brand-900/70">
                <input type="checkbox" checked={useGeneralCV} onChange={e => setUseGeneralCV(e.target.checked)} disabled={loading}
                  className="h-4 w-4 rounded border-brand-200 text-brand-600 focus:ring-brand-400/40" />
                Usar mi registro en Banco de talentos
              </label>
              {!useGeneralCV && (
                <label className="block text-sm text-brand-900/70">
                  Subir CV (PDF, DOC o DOCX — máx. 5MB)
                  <input type="file" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files?.[0] ?? null)} disabled={loading}
                    className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none file:mr-3 file:rounded-xl file:border-0 file:bg-brand-400 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-brand-50 focus:ring-2 focus:ring-brand-400/40" />
                </label>
              )}
            </fieldset>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full rounded-2xl border border-transparent bg-brand-400 px-4 py-3 text-sm font-semibold text-brand-50 shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Enviando postulación…' : 'Enviar postulación'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-brand-900/60">
            <Link href="/buscar-empleos" className="text-brand-600 underline hover:text-brand-800">
              Volver a vacantes
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
