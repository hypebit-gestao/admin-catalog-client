"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "next-auth/react";
import { CgLogOut, CgProfile } from "react-icons/cg";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import useProfileModal from "@/utils/hooks/user/useProfileModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HiSearch } from "react-icons/hi";
import { cn } from "@/lib/utils";
import Link from "next/link";

const Header = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const profileModal = useProfileModal();
  const [searchFocused, setSearchFocused] = useState(false);

  const onLogout = () => {
    signOut({ redirect: false }).then(() => {
      toast.success("Deslogado com sucesso");
      router.push("/");
    });
  };

  return (
    <header
      className={cn(
        "bg-green-primary shadow-lg w-full h-16 md:h-20 fixed top-0 left-0 right-0",
        "flex justify-between items-center px-4 md:px-6 lg:px-8 z-[100]",
        "transition-all duration-300",
        status === "authenticated" ? "flex" : "hidden"
      )}
    >
      {/* Logo */}
      <Link href="/home" className="flex items-center gap-2 min-w-0">
        <h1 className="text-white font-bold text-lg md:text-xl truncate">
          Catálogo Place
        </h1>
      </Link>

      {/* Search bar - desktop */}
      {/* <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
        <div
          className={cn(
            "flex items-center w-full bg-white/10 rounded-lg px-3 py-2 transition-all duration-200",
            searchFocused && "bg-white/15 ring-2 ring-white/20"
          )}
        >
          <HiSearch className="text-white/60 mr-2 flex-shrink-0" size={20} />
          <input
            type="text"
            placeholder="Buscar produtos, pedidos..."
            className="bg-transparent text-white placeholder-white/60 w-full text-sm outline-none"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div> */}

      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-4">
        <span className="hidden lg:block text-white/90 text-sm font-medium truncate max-w-[150px]">
          {session?.user?.user?.name}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-colors outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Menu do usuário"
            >
              <Avatar className="h-9 w-9 md:h-10 md:w-10 ring-2 ring-white/20">
                <AvatarImage
                  className="object-cover"
                  src={session?.user?.user?.image_url}
                />
                <AvatarFallback className="bg-white/20 text-white text-sm">
                  <CgProfile size={20} />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2">
              <p className="text-sm font-medium truncate">
                {session?.user?.user?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => profileModal.onOpen()}
              className="cursor-pointer"
            >
              <CgProfile className="mr-2" size={18} />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <CgLogOut className="mr-2" size={18} />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
