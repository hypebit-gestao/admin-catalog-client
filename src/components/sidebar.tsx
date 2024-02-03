"use client";

import React from "react";
import MenuItem from "./menu-item";
import { FaHome, FaStore, FaUser } from "react-icons/fa";
import { MdCategory, MdOutlineProductionQuantityLimits } from "react-icons/md";
import { useSession } from "next-auth/react";

const Sidebar = () => {
  const { data: session, status } = useSession();
  console.log("session: ", session?.user?.user.user_type);

  const isAdmin = session?.user?.user?.user_type === 2;

  return (
    <aside
      className={`fixed left-0 p-3 bg-green-primary min-h-screen mt-20 w-52 ${
        status === "authenticated" ? "block" : "hidden"
      }`}
    >
      <ul className="mt-14">
        <MenuItem href="/home" label="Home" icon={FaHome} />
        {isAdmin && <MenuItem href="/user" label="Lojas" icon={FaStore} />}
        {!isAdmin && (
          <MenuItem href="/category" label="Categorias" icon={MdCategory} />
        )}
        {!isAdmin && (
          <MenuItem
            href="/product"
            label="Produtos"
            icon={MdOutlineProductionQuantityLimits}
          />
        )}
      </ul>
    </aside>
  );
};

export default Sidebar;
