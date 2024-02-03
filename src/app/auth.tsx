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
      <>
        <Loader color="text-green-primary" />
      </>
    );
  }

  if (status !== "authenticated") {
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
