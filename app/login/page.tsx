'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { login } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const authError = useSearchParams().get('error');

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    });
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); return; }
    if (data.url) window.location.href = data.url;
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 rounded-3xl border border-transparent bg-white p-8 shadow-[0_35px_90px_rgba(0,0,0,0.08)] lg:flex-row">
      <div className="flex-1">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-600">Portal de empleo Eusse</p>
        <h1 className="my-3 text-3xl font-bold text-brand-900">Inicia sesión para continuar</h1>

        {(error || authError) && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error || 'Error al iniciar sesión. Por favor, intenta de nuevo.'}
          </div>
        )}

        <div className="mt-7 space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-transparent bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-900 shadow-[0_18px_45px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          <div className="relative my-5 text-center text-xs uppercase tracking-[0.3em] text-brand-900/40">
            <span className="relative px-4"> — o — </span>
          </div>
        </div>

        <form className="mt-6 space-y-4" action={handleSubmit}>
          <label className="block text-sm text-brand-900/70">
            Correo
            <input
              required
              type="email"
              name="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              disabled={isPending}
              className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
            />
          </label>
          <label className="block text-sm text-brand-900/70">
            Contraseña
            <input
              required
              type="password"
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isPending}
              className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
            />
          </label>
          <div className="flex items-center justify-between text-sm text-brand-900/70 mb-8">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="remember" className="h-4 w-4 rounded border-brand-200 text-brand-600 focus:ring-brand-400/40" />
              Recordarme
            </label>
            <Link href="/recuperar" className="font-semibold text-brand-600">¿Olvidaste tu contraseña?</Link>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-2xl border border-transparent bg-brand-400 px-4 py-3 text-sm font-semibold text-brand-50 shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-6 text-sm text-brand-900/70">
          ¿Aún no tienes cuenta?{' '}
          <Link href="/registro" className="font-semibold text-brand-600">Regístrate aquí</Link>
        </p>
      </div>

      <aside className="flex w-full max-w-md items-center justify-center rounded-2xl border border-transparent bg-brand-900 p-8 text-brand-50 shadow-[0_35px_90px_rgba(0,0,0,0.2)]">
        <Image src="/logo-eusse-reducido.png" alt="Logo Eusse" width={500} height={500} />
      </aside>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-brand-50 py-12 text-brand-900">
      <Suspense fallback={
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center rounded-3xl border border-transparent bg-white p-8 shadow-[0_35px_90px_rgba(0,0,0,0.08)]">
          <p className="text-brand-900/70">Cargando...</p>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </main>
  );
}
