'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { requestPasswordReset } from '@/lib/actions/auth';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function RecoverPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    const result = await requestPasswordReset(email);
    if (result.error) {
      setError(result.error);
      setStatus('error');
    } else {
      setStatus('success');
    }
  };

  const loading = status === 'loading';

  if (status === 'success') {
    return (
      <div className="flex flex-1 items-center justify-center bg-brand-50 px-4 py-8 text-brand-900">
        <div className="w-full max-w-md rounded-2xl border border-transparent bg-white p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.08)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brand-900">Revisa tu correo</h1>
          <p className="mt-3 text-brand-900/70">
            Si el correo existe en el sistema, recibirás un enlace para restablecer tu contraseña. El enlace expira en 1 hora.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-transparent bg-brand-400 px-6 py-3 text-sm font-semibold text-brand-50 shadow-[0_20px_55px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-50 px-4 py-8 text-brand-900">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-transparent bg-white shadow-[0_35px_90px_rgba(0,0,0,0.08)]">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-r border-brand-50 p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-600">Recuperar acceso</p>
            <h1 className="mt-3 text-3xl font-bold text-brand-900">Recuperar contraseña</h1>

            {status === 'error' && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm text-brand-900/70">
                Correo electrónico
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Escribí tu correo electrónico"
                  autoComplete="email"
                  disabled={loading}
                  className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl border border-transparent bg-brand-400 px-4 py-3 text-sm font-semibold text-brand-50 shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>

            <p className="mt-6 text-sm text-brand-900/70">
              ¿Ya recordaste tu contraseña?{' '}
              <Link href="/login" className="font-semibold text-brand-600">Inicia sesión aquí</Link>
            </p>
          </div>

          <aside className="flex w-full items-center justify-center rounded-2xl border border-transparent bg-brand-900 p-8 text-brand-50 shadow-[0_35px_90px_rgba(0,0,0,0.2)]">
            <Image
              src="/logo-eusse-reducido.webp"
              alt="Logo Eusse"
              width={320}
              height={320}
              sizes="(max-width: 768px) 60vw, 320px"
              className="h-auto w-full max-w-64 object-contain"
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
