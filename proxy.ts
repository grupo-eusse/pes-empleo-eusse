import { type NextRequest, NextResponse } from "next/server";

import {
  getAllowedRoles,
  getRedirectForRole,
  isAuthEntryRoute,
} from "@/lib/auth/navigation";
import { updateSession } from "@/lib/supabase/middleware";
import type { UserRole } from "@/types/auth";

function redirectWithCookies(source: NextResponse, url: URL) {
  const response = NextResponse.redirect(url);

  for (const cookie of source.cookies.getAll()) {
    response.cookies.set(cookie);
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (!supabase) {
    if (isAuthEntryRoute(pathname)) {
      return supabaseResponse;
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return redirectWithCookies(supabaseResponse, loginUrl);
  }

  if (isAuthEntryRoute(pathname)) {
    if (!user) {
      return supabaseResponse;
    }

    const { data: profile } = await supabase
      .from("user_profile")
      .select("user_role")
      .eq("supabase_id", user.id)
      .single();

    if (!profile) {
      return supabaseResponse;
    }

    return redirectWithCookies(
      supabaseResponse,
      new URL(getRedirectForRole(profile.user_role as UserRole), request.url),
    );
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return redirectWithCookies(supabaseResponse, loginUrl);
  }

  const { data: profile, error } = await supabase
    .from("user_profile")
    .select("user_role, is_active")
    .eq("supabase_id", user.id)
    .single();

  if (error || !profile || !profile.is_active) {
    await supabase.auth.signOut();
    return redirectWithCookies(supabaseResponse, new URL("/login", request.url));
  }

  const allowedRoles = getAllowedRoles(pathname);

  if (allowedRoles && !allowedRoles.includes(profile.user_role as UserRole)) {
    return redirectWithCookies(
      supabaseResponse,
      new URL(getRedirectForRole(profile.user_role as UserRole), request.url),
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/registro"],
};
