"use client";

import clsx from "clsx";
import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";

type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & {
  label: string;
  error?: string | null;
  labelClassName?: string;
  wrapperClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
};

export default function PasswordInput({
  label,
  error,
  labelClassName,
  wrapperClassName,
  inputClassName,
  errorClassName,
  disabled,
  "aria-describedby": ariaDescribedBy,
  ...inputProps
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = useId();
  const describedBy = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <label className={clsx("block text-sm text-brand-900/70", labelClassName)}>
      {label}
      <div className={clsx("relative mt-1", wrapperClassName)}>
        <input
          {...inputProps}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={clsx(
            "w-full rounded-2xl border border-transparent bg-brand-50 px-3 py-2 pr-12 text-brand-900 outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50",
            inputClassName,
          )}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowPassword((value) => !value)}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={showPassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-900/50 transition hover:text-brand-900/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error ? (
        <p id={errorId} className={clsx("mt-1 text-xs text-red-500", errorClassName)}>
          {error}
        </p>
      ) : null}
    </label>
  );
}
