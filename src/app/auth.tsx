"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";
import Login from "./page";
import Loader from "@/components/loader";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
}

const Auth: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
        <Loader color="text-green-primary" />
        <p className="text-sm text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (status !== "authenticated" && !pathname?.includes("password_reset")) {
    return (
      <>
        <Login />
      </>
    );
  }

  if (status === "authenticated" && pathname === "/") {
    router.replace("/home");
  }

  return <>{children}</>;
};

export default Auth;
