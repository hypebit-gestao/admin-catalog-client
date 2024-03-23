"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "next-auth/react";
import { CgLogOut } from "react-icons/cg";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CgProfile } from "react-icons/cg";
import useProfileModal from "@/utils/hooks/user/useProfileModal";

const Header = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const profileModal = useProfileModal();

  const onLogout = () => {
    signOut({ redirect: false }).then(() => {
      toast.success("Deslogado com sucesso");
      router.push("/");
    });
  };
  return (
    <header
      className={`bg-green-primary shadow-xl w-screen h-20 fixed top-0   justify-between items-center px-4 z-[100] ${
        status === "authenticated" ? "flex" : "hidden"
      }`}
    >
      <div>
        <h1 className="text-white">Catalogo Place</h1>
      </div>
      <div>
        <h1 className="text-xl text-white text-center">
          {session?.user?.user?.name}
        </h1>
      </div>
      <div className="flex items-center">
        <div onClick={onLogout} className="mr-6 flex cursor-pointer">
          <h3 className="mr-4 text-white">Sair</h3>
          <CgLogOut className="cursor-pointer" size={28} color="white" />
        </div>
        <div onClick={() => profileModal.onOpen()} className="cursor-pointer">
          <Avatar className="bg-white p-2 w-auto h-auto">
            <AvatarImage
              className="w-10 h-10"
              src={session?.user?.user?.image_url}
            />
            <AvatarFallback className="w-10 h-10">
              <CgProfile size={40} color="black" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
