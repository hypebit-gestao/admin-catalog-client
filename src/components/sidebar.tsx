"use client";

import React from "react";
import MenuItem from "./menu-item";
import { FaCubes, FaHome, FaStore, FaUser } from "react-icons/fa";
import {
  MdCategory,
  MdOutlineProductionQuantityLimits,
  MdRequestPage,
  MdSettings,
} from "react-icons/md";
import { BiSolidCoupon } from "react-icons/bi";
import { TbRulerMeasure } from "react-icons/tb";
import { useSession } from "next-auth/react";

const Sidebar = () => {
  const { data: session, status } = useSession();

  const isAdmin = session?.user?.user?.user_type === 2;

  return (
    <aside
      className={`  bg-green-primary mt-20  lg:w-52 ${
        status === "authenticated" ? "block" : "hidden"
      }`}
    >
      <ul className="mt-14">
        <MenuItem href="/home" label="Home" icon={FaHome} />
        {isAdmin && <MenuItem href="/user" label="Lojas" icon={FaStore} />}

        <MenuItem href="/category" label="Categorias" icon={MdCategory} />

        {
          <MenuItem
            href="/product"
            label="Produtos"
            icon={MdOutlineProductionQuantityLimits}
          />
        }

        {/* <MenuItem href="/coupon" label="Cupons" icon={BiSolidCoupon} /> */}
        { (
          <MenuItem href="/size" label="Tamanhos" icon={TbRulerMeasure} />
        )}
       {/* {<MenuItem href="/attribute" label="Atributos" icon={FaCubes} />} */}
        <MenuItem href="/order" label="Pedidos" icon={MdRequestPage} />
        <MenuItem
          href="/configurations"
          label="Configurações"
          icon={MdSettings}
        />
      </ul>
    </aside>
  );
};

export default Sidebar;
