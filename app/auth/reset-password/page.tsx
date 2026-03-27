'use client';

import Link from 'next/link';
import { useState } from 'react';
import { updatePassword } from '@/lib/actions/auth';
import PasswordInput from '@/ui/components/password_input';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError(null);
    const result = await updatePassword(password);
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brand-900">Contraseña actualizada</h1>
          <p className="mt-3 text-brand-900/70">
            Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-transparent bg-brand-400 px-6 py-3 text-sm font-semibold text-brand-50 shadow-[0_20px_55px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-50 px-4 py-8 text-brand-900">
      <div className="w-full max-w-md rounded-3xl border border-transparent bg-white p-8 shadow-[0_35px_90px_rgba(0,0,0,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-600">Seguridad</p>
        <h1 className="mt-3 text-3xl font-bold text-brand-900">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-brand-900/60">Ingresa tu nueva contraseña para tu cuenta.</p>

        {status === 'error' && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <PasswordInput
            required
            minLength={8}
            label="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Creá una contraseña de al menos 8 caracteres"
            autoComplete="new-password"
            disabled={loading}
          />

          <PasswordInput
            required
            minLength={8}
            label="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Volvé a escribir tu contraseña"
            autoComplete="new-password"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl border border-transparent bg-brand-400 px-4 py-3 text-sm font-semibold text-brand-50 shadow-[0_20px_55px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Actualizando…' : 'Actualizar contraseña'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-900/60">
          <Link href="/login" className="text-brand-600 underline hover:text-brand-800">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
