"use client";

import Link from "next/link";
import React from "react";
import { IconType } from "react-icons/lib";
interface MenuItemProps {
  label: string;
  icon: IconType | string;
  href: string;
}

const MenuItem = ({ label, icon: Icon, href }: MenuItemProps) => {
  return (
    <Link href={href}>
      <li className="w-full cursor-pointer text-white flex items-center mb-8">
        <Icon color="text-white" size={28} className="mr-3" />
        {label}
      </li>
    </Link>
  );
};

export default MenuItem;
