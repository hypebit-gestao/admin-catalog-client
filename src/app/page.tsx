"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Loader from "@/components/loader";
import useForgotPasswordModal from "@/utils/hooks/forgotPasswordModal";
import Image from "next/image";
import logo from "../../public/images/logo.png";
import { TfiEmail } from "react-icons/tfi";
import { CiLock } from "react-icons/ci";
import useRenewalSubscriptionModal from "@/utils/hooks/renewalSubscriptionModal";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  password: z.string().min(4, "Senha é obrigatório"),
});

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const forgotPasswordModal = useForgotPasswordModal();
  const renewalSubscriptionModal = useRenewalSubscriptionModal();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    signIn("credentials", {
      ...values,
      redirect: false,
    }).then((callback: any) => {
      if (callback.ok) {
        setLoading(false);
        router.push("/home");
        toast.success("Logado com sucesso");
      } else {
        setLoading(false);
        if (callback.error === "33") {
          toast.error(
            "Conta inativa. Entre em contato com o suporte para obter assistência."
          );
          renewalSubscriptionModal.onOpen();
        } else {
          toast.error(callback.error);
        }
      }
    });
  };

  return (
    <main className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div
        className={cn(
          "hidden xl:flex w-[55%] min-h-screen",
          "bg-gradient-to-br from-green-primary via-green-primary to-green-secondary",
          "flex-col justify-center items-center p-12"
        )}
      >
        <div className="max-w-md">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Catálogo Place
          </h1>
          <p className="mt-6 text-lg text-white/80 leading-relaxed">
            Gerencie seu e-commerce de forma simples e eficiente. Produtos,
            categorias e pedidos em um só lugar.
          </p>
          <div className="mt-12 flex gap-6">
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-lg">📦</span>
              </div>
              <span className="text-sm">Gestão de produtos</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-lg">📋</span>
              </div>
              <span className="text-sm">Pedidos centralizados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div
        className={cn(
          "flex-1 min-h-screen flex flex-col justify-center",
          "bg-white px-6 py-12 sm:px-12 lg:px-16",
          "shadow-2xl xl:shadow-none"
        )}
      >
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-center xl:hidden mb-8">
            <Image
              src={logo}
              alt="Logo do Catálogo Place"
              width={80}
              height={80}
            />
          </div>

          <div className="xl:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-green-primary">
              Catálogo Place
            </h1>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Entre na sua conta
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Insira suas credenciais para acessar o painel
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        icon={
                          <>
                            <TfiEmail size={20} color="#6b7280" />
                          </>
                        }
                        height="h-11"
                        placeholder="seu@email.com"
                        className="transition-all focus:ring-2 focus:ring-green-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        icon={
                          <>
                            <CiLock size={20} color="#6b7280" />
                          </>
                        }
                        type="password"
                        height="h-11"
                        placeholder="••••••••"
                        className="transition-all focus:ring-2 focus:ring-green-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <button
                  type="button"
                  onClick={() => forgotPasswordModal.onOpen()}
                  className="text-sm text-green-primary hover:text-green-secondary font-medium transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <Button
                className="w-full h-11 bg-green-primary hover:bg-green-primary/90 text-base font-medium"
                size="lg"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Loader color="text-white" />
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
}
