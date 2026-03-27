"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildInviteRegistrationPath, getSafeInternalPath } from "@/lib/invite_registration_utils";

function InviteAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    const supabase = createClient();
    const nextPath = getSafeInternalPath(searchParams.get("next"));
    let isResolved = false;

    const finishRedirect = async () => {
      if (isResolved) {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        isResolved = true;
        router.replace("/login?error=auth_callback_error");
        return;
      }

      isResolved = true;
      router.replace(buildInviteRegistrationPath(nextPath));
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isResolved) {
        return;
      }

      if (!session) {
        return;
      }

      isResolved = true;
      router.replace(buildInviteRegistrationPath(nextPath));
    });

    finishRedirect().catch(() => {
      if (!isResolved) {
        isResolved = true;
        router.replace("/login?error=auth_callback_error");
      }
    });

    const fallbackTimer = window.setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        router.replace("/login?error=auth_callback_error");
      }
    }, 4000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(fallbackTimer);
    };
  }, [router, searchParams]);

  return (
    <InviteAuthFallback />
  );
}

function InviteAuthFallback() {
  return (
    <div className="flex flex-1 items-center justify-center bg-brand-50 px-4 py-8 text-brand-900">
      <div className="w-full max-w-md rounded-2xl border border-transparent bg-white p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-600">Invitacion al equipo</p>
        <h1 className="mt-3 text-2xl font-bold text-brand-900">Validando acceso</h1>
        <p className="mt-3 text-sm text-brand-900/70">
          Estamos confirmando tu invitacion y preparando el formulario de acceso.
        </p>
      </div>
    </div>
  );
}

export default function InviteAuthPage() {
  return (
    <Suspense fallback={<InviteAuthFallback />}>
      <InviteAuthContent />
    </Suspense>
  );
}
