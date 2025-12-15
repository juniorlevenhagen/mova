"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, BarChart3, Home } from "lucide-react";

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/admin/blog",
      label: "Blog",
      icon: FileText,
      active: pathname?.startsWith("/admin/blog"),
    },
    {
      href: "/admin/metrics",
      label: "Métricas",
      icon: BarChart3,
      active: pathname?.startsWith("/admin/metrics"),
    },
  ];

  return (
    <nav className="mb-8">
      <div className="bg-white rounded-[24px] border-2 border-black p-2 inline-flex gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-zalando font-semibold
                ${
                  isActive
                    ? "bg-black text-white"
                    : "text-black hover:bg-gray-100"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

