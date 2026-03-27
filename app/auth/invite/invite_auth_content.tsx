"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildInviteRegistrationPath } from "@/lib/invite_registration_utils";
import { getInviteAuthOutcome } from "./invite_auth_logic";

interface InviteAuthContentProps {
  nextPath: string;
}

export function InviteAuthFallback() {
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

export default function InviteAuthContent({ nextPath }: InviteAuthContentProps) {
  const router = useRouter();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    const supabase = createClient();
    let isResolved = false;

    console.log("[auth/invite] mounted", {
      pathname: window.location.pathname,
      search: window.location.search,
      hasHash: Boolean(window.location.hash),
      hashPreview: window.location.hash.slice(0, 80),
    });

    const redirectToOutcome = (outcome: ReturnType<typeof getInviteAuthOutcome>) => {
      if (isResolved) {
        return;
      }

      if (outcome === "wait") {
        return;
      }

      isResolved = true;
      if (outcome === "error") {
        router.replace("/login?error=auth_callback_error");
        return;
      }

      router.replace(buildInviteRegistrationPath(nextPath));
    };

    const finishRedirect = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const hasHashToken = typeof window !== "undefined" && 
        (window.location.hash.includes("access_token=") || window.location.hash.includes("type=invite"));

      // Sí hay un token en la URL, estamos procesando un nuevo login desde el enlace de invitación.
      // Debemos ignorar cualquier sesión previa de otra cuenta que pudiera estar activa.
      if (hasHashToken) {
        console.log("[auth/invite] hash detectado; esperando evento SIGNED_IN", {
          hashPreview: window.location.hash.slice(0, 80),
        });
        // Ignoramos la sesión local y dejamos que Supabase resuelva el token de la URL.
        return;
      }

      // Solo consideramos válida una sesión si pertenece a una invitación de HR/Admin
      const isValidInviteSession = Boolean(session?.user?.user_metadata?.invited_role);

      console.log("[auth/invite] getSession sin hash", {
        hasSession: Boolean(session),
        invitedRole: session?.user?.user_metadata?.invited_role ?? null,
      });

      redirectToOutcome(getInviteAuthOutcome({
        hasSession: isValidInviteSession,
        timedOut: false,
        hasErrored: false,
      }));
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("[auth/invite] onAuthStateChange", {
        event: _event,
        hasSession: Boolean(session),
        invitedRole: session?.user?.user_metadata?.invited_role ?? null,
      });

      const hasHashToken = typeof window !== "undefined" && 
        (window.location.hash.includes("access_token=") || window.location.hash.includes("type=invite"));
      
      if (hasHashToken && _event !== 'SIGNED_IN') {
        return; // Esperar a que se procese el hash
      }

      const isValidInviteSession = Boolean(session?.user?.user_metadata?.invited_role);

      redirectToOutcome(getInviteAuthOutcome({
        hasSession: isValidInviteSession,
        timedOut: false,
        hasErrored: false,
      }));
    });

    finishRedirect().catch(() => {
      redirectToOutcome(getInviteAuthOutcome({
        hasSession: false,
        timedOut: false,
        hasErrored: true,
      }));
    });

    const fallbackTimer = window.setTimeout(() => {
      console.error("[auth/invite] timeout esperando sesion de invitacion", {
        hasHash: Boolean(window.location.hash),
        hashPreview: window.location.hash.slice(0, 80),
      });

      redirectToOutcome(getInviteAuthOutcome({
        hasSession: false,
        timedOut: true,
        hasErrored: false,
      }));
    }, 10000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(fallbackTimer);
    };
  }, [nextPath, router]);

  return <InviteAuthFallback />;
}
