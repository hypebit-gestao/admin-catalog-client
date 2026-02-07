"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiChevronRight } from "react-icons/hi";
import { cn } from "@/lib/utils";

interface ContentMainProps {
  children: React.ReactNode;
  title: string;
  centralized?: boolean;
  subtitle?: string;
}

const pathLabels: Record<string, string> = {
  home: "Home",
  product: "Produtos",
  category: "Categorias",
  order: "Pedidos",
  user: "Lojas",
  size: "Tamanhos",
  configurations: "Configurações",
  coupon: "Cupons",
  attribute: "Atributos",
  analytics: "Análises",
};

const ContentMain: React.FC<ContentMainProps> = ({
  children,
  title,
  centralized,
  subtitle,
}) => {
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) || [];
  const breadcrumbs = segments.map((segment, index) => ({
    label: pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
    href: "/" + segments.slice(0, index + 1).join("/"),
    isLast: index === segments.length - 1,
  }));

  return (
    <div
      className={cn(
        "min-h-screen w-full",
        "bg-gray-primary",
        "pt-24 md:pt-28 lg:pt-32",
        "px-4 sm:px-6 lg:px-8 xl:px-12",
        "pb-12"
      )}
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            href="/home"
            className="hover:text-green-primary transition-colors"
          >
            Home
          </Link>
          {breadcrumbs.slice(1).map((crumb, i) => (
            <React.Fragment key={crumb.href}>
              <HiChevronRight size={16} className="text-muted-foreground/60" />
              {crumb.isLast ? (
                <span className="text-foreground font-medium">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-green-primary transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Page header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-green-primary tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Content */}
      <div className={cn(centralized && "flex flex-col items-center")}>
        {children}
      </div>
    </div>
  );
};

export default ContentMain;
