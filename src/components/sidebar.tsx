"use client";

import React from "react";
import MenuItem from "./menu-item";
import { FaHome, FaStore, FaUser } from "react-icons/fa";
import { MdCategory, MdOutlineProductionQuantityLimits } from "react-icons/md";
import { useSession } from "next-auth/react";

const Sidebar = () => {
  const { data: session, status } = useSession();

  const isAdmin = session?.user?.user?.user_type === 2;

  return (
    <aside
      className={` p-3 bg-green-primary mt-20  lg:w-52 ${
        status === "authenticated" ? "block" : "hidden"
      }`}
    >
      <ul className="mt-14">
        <MenuItem href="/home" label="Home" icon={FaHome} />
        {isAdmin && <MenuItem href="/user" label="Lojas" icon={FaStore} />}
        {!isAdmin && (
          <MenuItem href="/category" label="Categorias" icon={MdCategory} />
        )}
        {
          <MenuItem
            href="/product"
            label="Produtos"
            icon={MdOutlineProductionQuantityLimits}
          />
        }
      </ul>
    </aside>
  );
};

export default Sidebar;
