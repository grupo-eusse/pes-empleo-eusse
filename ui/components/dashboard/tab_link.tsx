"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

interface TabLinkProps {
  href: string;
  children: React.ReactNode;
}

const BASE_CLASSES = "flex-1 rounded-xl border border-transparent px-4 py-2 text-center text-sm font-semibold transition";
const ACTIVE_CLASSES = "bg-brand-400 text-brand-50 shadow-[0_12px_30px_rgba(0,0,0,0.12)]";
const INACTIVE_CLASSES = "text-brand-900/60 hover:bg-brand-50 hover:text-brand-900";

export default function TabLink({ href, children }: TabLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      prefetch={false}
      className={clsx(BASE_CLASSES, isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES)}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
