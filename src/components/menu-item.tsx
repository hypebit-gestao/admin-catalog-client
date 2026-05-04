"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { IconType } from "react-icons/lib";
import { cn } from "@/lib/utils";

interface MenuItemProps {
  label: string;
  icon: IconType | string;
  href: string;
  collapsed?: boolean;
}

const MenuItem = ({ label, icon: Icon, href, collapsed }: MenuItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} onClick={() => {}}>
      <li
        className={cn(
          "flex items-center w-full cursor-pointer transition-all duration-200",
          "px-4 py-3 mx-2 rounded-lg mb-2",
          "group hover:bg-white/10",
          isActive
            ? "bg-white text-green-primary font-medium shadow-sm"
            : "text-white/90 hover:text-white"
        )}
        title={collapsed ? label : undefined}
      >
        <Icon
          className="flex-shrink-0 transition-colors"
          size={24}
          color={isActive ? "#081c15" : "rgba(255,255,255,0.9)"}
        />
        {!collapsed && (
          <span
            className={cn(
              "ml-3 whitespace-nowrap overflow-hidden",
              "transition-opacity duration-200"
            )}
          >
            {label}
          </span>
        )}
      </li>
    </Link>
  );
};

export default MenuItem;
