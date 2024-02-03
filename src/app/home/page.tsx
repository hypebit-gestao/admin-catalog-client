"use client";

import { signOut } from "next-auth/react";
import React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ContentMain from "@/components/content-main";

const Home = () => {
  return (
    <ContentMain title="Home">
      <div>
        <h1>Bem vindo ao Catálogo Online</h1>
      </div>
    </ContentMain>
  );
};

export default Home;
