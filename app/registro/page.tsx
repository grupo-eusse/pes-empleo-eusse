'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useTransition } from 'react';
import { signup } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';

// Íconos para el toggle de contraseña
function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (formData: FormData) => {
    setError(null);
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }

    startTransition(async () => {
      const result = await signup(formData);
      if (result?.error) setError(result.error);
      else if (result?.success) setSubmitted(true);
    });
  };

  const handleGoogleSignup = async () => {
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); return; }
    if (data.url) window.location.href = data.url;
  };

  if (submitted) {
    return (
      <div className="flex flex-1 items-center justify-center bg-brand-50 px-4 py-8 text-brand-900">
        <div className="w-full max-w-md rounded-2xl border border-transparent bg-white p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.08)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brand-900">Confirma tu correo</h1>
          <p className="mt-3 text-brand-900/70">
            Te enviamos un enlace para activar tu cuenta. Revisa tu bandeja de entrada o spam y haz clic en &quot;Confirmar registro&quot;.
          </p>
          <Link href="/login" className="mt-6 inline-flex items-center justify-center rounded-2xl border border-transparent bg-brand-400 px-6 py-3 text-sm font-semibold text-brand-50 shadow-[0_20px_55px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90">
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
            <p className="text-xs uppercase tracking-[0.35em] text-brand-600">Crear cuenta</p>
            <h1 className="mt-3 text-3xl font-bold text-brand-900">Postula y da seguimiento en línea</h1>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-4" action={handleSubmit}>
              <label className="block text-sm text-brand-900/70">
                Nombre completo
                <input
                  required
                  name="fullName"
                  placeholder="Escribí tu nombre completo"
                  disabled={isPending}
                  className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
                />
              </label>

              <label className="block text-sm text-brand-900/70">
                Correo
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="Escribí tu correo electrónico"
                  disabled={isPending}
                  className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
                />
              </label>

              <label className="block text-sm text-brand-900/70">
                Contraseña
                <div className="relative mt-1">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Creá una contraseña de al menos 8 caracteres"
                    minLength={8}
                    disabled={isPending}
                    className="w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 pr-10 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-900/50 hover:text-brand-900/80">
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="mt-1 text-xs text-red-500">La contraseña debe tener al menos 8 caracteres</p>
                )}
              </label>

              <label className="block text-sm text-brand-900/70">
                Confirmar contraseña
                <div className="relative mt-1">
                  <input
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Volvé a escribir tu contraseña"
                    disabled={isPending}
                    className={`w-full rounded-2xl border bg-brand-50 px-3 py-2 pr-10 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40 ${
                      confirmPassword.length > 0 && password !== confirmPassword ? 'border-red-300' : 'border-transparent'
                    }`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-900/50 hover:text-brand-900/80">
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
                )}
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-2xl border border-transparent bg-brand-400 px-4 py-3 text-sm font-semibold text-brand-50 shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>

            <p className="mt-6 text-sm text-brand-900/70">
              ¿Ya tienes cuenta?{' '}
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
