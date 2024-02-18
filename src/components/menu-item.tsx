"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { IconType } from "react-icons/lib";
interface MenuItemProps {
  label: string;
  icon: IconType | string;
  href: string;
}

const MenuItem = ({ label, icon: Icon, href }: MenuItemProps) => {
  const pathname = usePathname();
  return (
    <Link href={href}>
      <li
        className={`${
          pathname === href && "bg-white"
        } p-3 w-full cursor-pointer text-white flex items-center mb-8`}
      >
        <Icon
          color={`${pathname === href ? "black" : "white"}`}
          size={28}
          className="mr-3"
        />
        <span className={`hidden lg:block ${pathname == href && "text-black"}`}>
          {label}
        </span>
      </li>
    </Link>
  );
};

export default MenuItem;
