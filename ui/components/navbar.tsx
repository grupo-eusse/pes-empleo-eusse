'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useCallback, useState, useTransition } from 'react';
import BurgerBtn from './burguer_btn';
import { logout } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/auth';

interface NavbarUser {
  id: string;
  email: string;
}

const PUBLIC_LINKS = [
  { href: '/buscar-empleos', label: 'Buscar empleos' },
  { href: '/quienes-somos', label: 'Quienes somos' },
  { href: '/faq', label: 'FAQ' },
];

const DASHBOARD_PATHS = [
  '/dashboard/puestos',
  '/dashboard/aplicaciones',
  '/dashboard/resumes',
  '/dashboard/configuracion',
  '/dashboard/metricas',
];

const canAccessDashboard = (role?: UserRole | null) => role === 'hr' || role === 'admin';

export default function Navbar() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<NavbarUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const syncSession = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setUser(null);
      setUserRole(null);
      return;
    }
    setUser({ id: session.user.id, email: session.user.email ?? '' });
    const { data: profile } = await supabase
      .from('user_profile')
      .select('user_role')
      .eq('supabase_id', session.user.id)
      .single();
    setUserRole((profile?.user_role as UserRole) ?? null);
  }, []);

  // Re-sync auth whenever the route changes (covers server-action redirects)
  useEffect(() => { syncSession(); }, [pathname, syncSession]);

  // Also listen for real-time auth events (login/logout from other tabs, token refresh)
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      syncSession();
    });
    return () => { subscription.unsubscribe(); };
  }, [syncSession]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const isDashboardActive = DASHBOARD_PATHS.some((p) => pathname.startsWith(p));

  const links = [
    ...PUBLIC_LINKS,
    ...(user && userRole === 'postulant' ? [{ href: '/dashboard/postulante', label: 'Mi panel' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-brand-50/80 backdrop-blur">
      <nav className="relative mx-auto min-h-14 lg:min-h-[7vh] px-4 py-1 flex items-center lg:mx-[5vw]">
        <Link href="/" className="h-full shrink-0 sm:shrink basis-[200px] sm:basis-60 md:basis-[200px]">
          <img src="/logo-eusse-completo.png" alt="Eusse" className="h-full max-h-14 w-auto object-contain transition-[height] duration-200 hidden sm:block" />
          <img src="/logo-eusse-peq.png"      alt="Eusse" className="h-full max-h-14 w-auto object-contain transition-[height] duration-200 block sm:hidden" />
        </Link>

        <div className="flex-1" />

        <ul className="hidden sm:flex items-center gap-x-[clamp(0.5rem,2.2vw,1.25rem)] whitespace-nowrap">
          {links.map((link) => (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className={`transition-colors duration-200 text-[clamp(1rem,1.5vw,1.3rem)] ${
                  isActive(link.href)
                    ? 'text-accent font-semibold border-b-2 border-accent pb-1'
                    : 'text-brand-900 hover:text-accent/80'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}

          {!user ? (
            <li className="ml-4">
              <Link href="/login" className="bg-accent text-white font-medium px-4 py-2 rounded-md shadow-sm hover:bg-accent/90 transition-all duration-200">
                Iniciar sesion
              </Link>
            </li>
          ) : (
            <>
              {canAccessDashboard(userRole) && (
                <li>
                  <Link
                    href="/dashboard/puestos"
                    className={`border border-slate-200 text-brand-900 font-medium px-4 py-2 rounded-md shadow-sm hover:border-accent/50 transition-all duration-200 ${
                      isDashboardActive ? 'border-accent bg-accent/10' : ''
                    }`}
                  >
                    RRHH
                  </Link>
                </li>
              )}
              <li className="ml-2">
                <button
                  onClick={() => startTransition(() => logout())}
                  disabled={isPending}
                  className="bg-brand-900 text-white font-medium px-4 py-2 rounded-md shadow-sm hover:bg-brand-800 transition-all duration-200 disabled:opacity-50"
                >
                  {isPending ? 'Saliendo...' : 'Cerrar sesion'}
                </button>
              </li>
            </>
          )}
        </ul>

        <div className="md:hidden ml-2 shrink-0">
          <BurgerBtn links={links} user={user} userRole={userRole} />
        </div>
      </nav>
    </header>
  );
}
