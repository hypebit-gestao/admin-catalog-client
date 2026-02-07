"use client";

import React, { useState } from "react";
import MenuItem from "./menu-item";
import { FaCubes, FaHome, FaStore, FaUser } from "react-icons/fa";
import {
  MdCategory,
  MdOutlineProductionQuantityLimits,
  MdRequestPage,
  MdSettings,
  MdAnalytics,
} from "react-icons/md";
import { BiSolidCoupon } from "react-icons/bi";
import { TbRulerMeasure } from "react-icons/tb";
import { useSession } from "next-auth/react";
import { HiMenuAlt2, HiX } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const { data: session, status } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAdmin = session?.user?.user?.user_type === 2;

  if (status !== "authenticated") {
    return null;
  }

  const menuClass = cn(
    "fixed lg:static z-50",
    "top-20 lg:top-0 bottom-0 left-0",
    "bg-green-primary lg:mt-20 pt-4",
    "transition-all duration-300 ease-in-out",
    "shadow-xl lg:shadow-none",
    isCollapsed ? "lg:w-20" : "lg:w-56",
    isMobileOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className={cn(
          "lg:hidden fixed left-4 top-20 z-[101]",
          "p-2 rounded-lg bg-green-primary text-white",
          "shadow-lg hover:bg-green-primary/90 transition-colors"
        )}
        aria-label={isMobileOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isMobileOpen ? <HiX size={24} /> : <HiMenuAlt2 size={24} />}
      </button>

      <aside className={menuClass}>
        {/* Desktop collapse toggle */}
        <div className="hidden lg:flex justify-end p-2 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white/80 hover:text-white hover:bg-white/10"
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? (
              <HiMenuAlt2 size={20} className="rotate-180" />
            ) : (
              <HiMenuAlt2 size={20} />
            )}
          </Button>
        </div>

        <ul className="mt-4 lg:mt-2 pb-8">
          <MenuItem
            href="/home"
            label="Dashboard"
            icon={FaHome}
            collapsed={isCollapsed}
          />
          {isAdmin && (
            <MenuItem
              href="/user"
              label="Lojas"
              icon={FaStore}
              collapsed={isCollapsed}
            />
          )}
          <MenuItem
            href="/category"
            label="Categorias"
            icon={MdCategory}
            collapsed={isCollapsed}
          />
          <MenuItem
            href="/product"
            label="Produtos"
            icon={MdOutlineProductionQuantityLimits}
            collapsed={isCollapsed}
          />
          <MenuItem
            href="/size"
            label="Tamanhos"
            icon={TbRulerMeasure}
            collapsed={isCollapsed}
          />
          <MenuItem
            href="/order"
            label="Pedidos"
            icon={MdRequestPage}
            collapsed={isCollapsed}
          />
          {/* <MenuItem
            href="/analytics"
            label="Análises"
            icon={MdAnalytics}
            collapsed={isCollapsed}
          /> */}
          <MenuItem
            href="/configurations"
            label="Configurações"
            icon={MdSettings}
            collapsed={isCollapsed}
          />
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
