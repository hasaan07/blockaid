"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireUser } from "@/components/RequireUser";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/donations", label: "Donations" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireUser role="admin">
      <section className="px-6 py-10 sm:px-12">
        <h2 className="text-gradient mb-2 text-3xl font-bold">Admin Panel</h2>
        <p className="mb-6 text-muted">Monitor platform activity and moderate content.</p>

        <div className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {TABS.map((tab) => {
            const active =
              tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active ? "bg-cyan text-ink" : "border border-white/15 text-muted hover:text-body"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {children}
      </section>
    </RequireUser>
  );
}
