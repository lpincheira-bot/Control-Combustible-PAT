"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const tabs = [
  { href: "/admin", label: "Registros" },
  { href: "/admin/vehiculos", label: "Vehículos" },
  { href: "/admin/conductores", label: "Conductores" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-paper-line">
      <div className="max-w-5xl mx-auto px-6 pt-6 flex items-start justify-between">
        <div>
          <p className="text-paper-accent text-xs tracking-wider">
            REGISTRO DE FLOTA
          </p>
          <h1 className="text-xl font-semibold mt-1">
            Control de Combustible
          </h1>
        </div>
        <LogoutButton className="mt-1 text-paper-ink-muted hover:text-paper-ink" />
      </div>
      <nav className="max-w-5xl mx-auto px-6 mt-5 flex gap-6 text-sm">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 border-b-2 -mb-px transition ${
                active
                  ? "border-paper-accent text-paper-ink font-medium"
                  : "border-transparent text-paper-ink-muted hover:text-paper-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
