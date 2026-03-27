"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { completeInviteRegistration } from "@/lib/actions/auth";

interface InviteRegistrationFormProps {
  email: string;
  initialName: string;
  roleLabel: string;
  nextPath: string;
}

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

export default function InviteRegistrationForm({
  email,
  initialName,
  roleLabel,
  nextPath,
}: InviteRegistrationFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(initialName);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (formData: FormData) => {
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }

    startTransition(async () => {
      const result = await completeInviteRegistration(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-50 px-4 py-8 text-brand-900">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-transparent bg-white shadow-[0_35px_90px_rgba(0,0,0,0.08)]">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-r border-brand-50 p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-600">Invitacion al equipo</p>
            <h1 className="mt-3 text-3xl font-bold text-brand-900">Completa tu acceso</h1>
            <p className="mt-3 text-sm text-brand-900/70">
              Esta invitacion activara tu perfil como <strong>{roleLabel}</strong>. Define tu nombre y una contrasena para continuar.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-4" action={handleSubmit}>
              <input type="hidden" name="next" value={nextPath} />

              <label className="block text-sm text-brand-900/70">
                Correo
                <input
                  readOnly
                  name="email"
                  value={email}
                  className="mt-1 w-full rounded-2xl border border-transparent bg-brand-100 px-3 py-2 text-brand-900 outline-none"
                />
              </label>

              <label className="block text-sm text-brand-900/70">
                Nombre completo
                <input
                  required
                  name="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Escribi tu nombre completo"
                  disabled={isPending}
                  className="mt-1 w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
                />
              </label>

              <label className="block text-sm text-brand-900/70">
                Contrasena
                <div className="relative mt-1">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Crea una contrasena de al menos 8 caracteres"
                    minLength={8}
                    disabled={isPending}
                    className="w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 pr-10 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-900/50 hover:text-brand-900/80">
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </label>

              <label className="block text-sm text-brand-900/70">
                Confirmar contrasena
                <div className="relative mt-1">
                  <input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Vuelve a escribir tu contrasena"
                    disabled={isPending}
                    className={`w-full rounded-2xl border bg-brand-50 px-3 py-2 pr-10 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40 ${
                      confirmPassword.length > 0 && password !== confirmPassword ? "border-red-300" : "border-transparent"
                    }`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-900/50 hover:text-brand-900/80">
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-2xl border border-transparent bg-brand-400 px-4 py-3 text-sm font-semibold text-brand-50 shadow-[0_25px_60px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-brand-400/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Activando acceso..." : "Activar acceso"}
              </button>
            </form>
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
