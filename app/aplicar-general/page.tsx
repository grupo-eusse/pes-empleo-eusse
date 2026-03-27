'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { uploadGeneralCV } from '@/lib/actions/postulant';
import { Skeleton } from '@/ui/components/skeleton';

interface PositionOption { id: number; description: string }
interface LocationOption { id: number; name: string }

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function AplicarGeneralPage() {
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [positionId, setPositionId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const [posRes, locRes] = await Promise.all([
          fetch('/api/jobs?type=positions'),
          fetch('/api/jobs?type=locations'),
        ]);
        const posData = await posRes.json();
        const locData = await locRes.json();
        setPositions(posData.data ?? []);
        setLocations(locData.data ?? []);
      } catch {
        console.error('Error cargando opciones');
      } finally {
        setOptionsLoading(false);
      }
    };
    void fetchOptions();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) { setError('Selecciona un archivo'); return; }
    if (!positionId || !locationId) { setError('Selecciona posición y ubicación'); return; }

    setError(null);
    setStatus('loading');

    startTransition(async () => {
      const formData = new FormData();
      formData.append('cv', file);
      formData.append('position_id', positionId);
      formData.append('location_id', locationId);

      const result = await uploadGeneralCV(formData);
      if (result.error) {
        setError(result.error);
        setStatus('error');
      } else {
        setStatus('success');
      }
    });
  };

  const loading = status === 'loading' || isPending;

  if (status === 'success') {
    return (
      <div className="flex flex-1 items-center justify-center bg-brand-50 px-4 py-8 text-brand-900">
        <div className="w-full max-w-md rounded-2xl border border-transparent bg-white p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.08)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brand-900">¡CV registrado!</h1>
          <p className="mt-3 text-brand-900/70">
            Tu currículum ha sido registrado en nuestra base de talentos. Te contactaremos cuando surjan oportunidades que se ajusten a tu perfil.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              href="/buscar-empleos"
              className="inline-flex items-center justify-center rounded-2xl border border-transparent bg-brand-400 px-6 py-3 text-sm font-semibold text-brand-50 shadow-[0_20px_55px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90"
            >
              Ver vacantes
            </Link>
            <Link
              href="/dashboard/postulante"
              className="inline-flex items-center justify-center rounded-2xl border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-900 transition hover:-translate-y-0.5"
            >
              Mi dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-50 px-4 py-8 text-brand-900">
      <div className="w-full max-w-2xl rounded-3xl border border-transparent bg-white p-8 shadow-[0_35px_90px_rgba(0,0,0,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-600">Base de talentos</p>
        <h1 className="mt-3 text-3xl font-bold text-brand-900">Registra tu currículum general</h1>
        <p className="mt-2 text-sm text-brand-900/60">
          Sube tu CV para que te consideremos en futuras oportunidades que se ajusten a tu perfil.
        </p>

        {(status === 'error' || error) && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-brand-900/70">
              Posición de interés
              {optionsLoading ? (
                <Skeleton className="mt-1 h-11 w-full" />
              ) : (
                <select
                  required
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                  disabled={loading}
                  className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
                >
                  <option value="">Selecciona una posición</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>{p.description}</option>
                  ))}
                </select>
              )}
            </label>
          </div>

          <div>
            <label className="block text-sm text-brand-900/70">
              Ubicación preferida
              {optionsLoading ? (
                <Skeleton className="mt-1 h-11 w-full" />
              ) : (
                <select
                  required
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  disabled={loading}
                  className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
                >
                  <option value="">Selecciona una ubicación</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              )}
            </label>
          </div>

          <div>
            <label className="block text-sm text-brand-900/70">
              Curriculum (PDF, DOC o DOCX — máx. 5MB)
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={loading}
                className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none file:mr-3 file:rounded-xl file:border-0 file:bg-brand-400 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-brand-50 focus:ring-2 focus:ring-brand-400/40"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl border border-transparent bg-brand-400 px-4 py-3 text-sm font-semibold text-brand-50 shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Subiendo CV…' : 'Registrar currículum'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-900/60">
          <Link href="/buscar-empleos" className="text-brand-600 underline hover:text-brand-800">
            Volver a vacantes
          </Link>
        </p>
      </div>
    </div>
  );
}
