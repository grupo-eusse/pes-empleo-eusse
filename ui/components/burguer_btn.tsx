'use client'

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import type { UserRole } from '@/types/auth';

interface LinkItem {
  href: string;
  label: string;
}

interface BurgerBtnProps {
  links: LinkItem[];
  user?: { id: string; email: string } | null;
  userRole?: UserRole | null;
}

const canAccessDashboard = (role?: UserRole | null) =>
  role === 'hr' || role === 'admin';

export default function BurgerBtn({ links, user, userRole }: BurgerBtnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleLogout = () => {
    setIsOpen(false);
    startTransition(() => logout());
  };

  // Enfocar el primer enlace al abrir el menú (accesibilidad)
  useEffect(() => {
    if (isOpen) firstLinkRef.current?.focus();
  }, [isOpen]);

  // Cerrar el menú al hacer click fuera de él
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={menuRef}>
      <button
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative h-10 w-10 shrink-0 grid place-items-center rounded-lg
                   bg-transparent p-0 hover:bg-slate-100 transition
                   appearance-none focus:outline-none sm:hidden"
      >
        {/* Animación hamburguesa → X */}
        <span className="relative block h-5 w-6 pointer-events-none subpixel-antialiased">
          {/* Barra superior */}
          <span
            className={`absolute left-1/2 top-1/2 h-0.5 w-6 -translate-x-1/2 -translate-y-1/2
                        rounded bg-brand-900 transform-gpu transition-transform duration-300 will-change-transform
                        ${isOpen ? 'rotate-45' : '-translate-y-[5px]'}`}
          />
          {/* Barra central */}
          <span
            className={`absolute left-1/2 top-1/2 h-0.5 w-6 -translate-x-1/2 -translate-y-1/2
                        rounded bg-brand-900 transform-gpu transition-opacity duration-200
                        ${isOpen ? 'opacity-0' : 'opacity-100'}`}
          />
          {/* Barra inferior */}
          <span
            className={`absolute left-1/2 top-1/2 h-0.5 w-6 -translate-x-1/2 -translate-y-1/2
                        rounded bg-brand-900 transform-gpu transition-transform duration-300 will-change-transform
                        ${isOpen ? '-rotate-45' : 'translate-y-[5px]'}`}
          />
        </span>
      </button>

      <div className="absolute left-0 right-0 top-full md:hidden">
        <div
          className={`origin-top overflow-hidden bg-white/95 backdrop-blur border-b shadow-sm
                      transition-all duration-300
                      ${isOpen ? 'max-h-[60vh] opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-95'}`}
        >
          <ul className="py-3 px-4 space-y-2">
            {links.map((link, index) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  ref={index === 0 ? firstLinkRef : undefined}
                  className={`block rounded-lg px-3 py-2 ${
                    isActive(link.href) ? 'text-accent font-semibold' : 'text-brand-900'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <hr className="mx-4 my-3 border-slate-200" />

          <div className="px-4 pb-4">
            {!user ? (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center bg-accent text-white font-medium px-4 py-3 rounded-xl shadow-sm hover:bg-accent/90 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-accent/40 transition"
              >
                Iniciar Sesión
              </Link>
            ) : (
              <>
                {canAccessDashboard(userRole) && (
                  <Link
                    href="/dashboard/puestos"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-accent/50 mb-2"
                  >
                    Panel RRHH
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  disabled={isPending}
                  className="block w-full text-center bg-brand-900 text-white font-medium px-4 py-3 rounded-xl shadow-sm hover:bg-brand-800 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-400/40 transition disabled:opacity-50"
                >
                  {isPending ? 'Saliendo...' : 'Cerrar sesión'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
