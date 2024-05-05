"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { MdEmail, MdPassword, MdSecurity } from "react-icons/md";
import { CiLock } from "react-icons/ci";
import { TfiEmail } from "react-icons/tfi";
import useRenewalSubscriptionModal from "@/utils/hooks/renewalSubscriptionModal";

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
    <main className="bg-[#081c15] min-h-screen flex justify-center items-center">
      <div className=" w-[60%] h-screen hidden xl:flex items-center justify-center">
        <h1 className="text-4xl font-bold text-white">Catálogo Place</h1>
      </div>
      <div className="w-[95%] xl:w-1/2  shadow-xl bg-white px-6 py-12 h-screen overflow-auto">
        <div className="flex justify-center">
          <Image
            src={logo}
            alt="Logo do Catálogo Place"
            width={100}
            height={100}
          />
        </div>
        <div className="mt-5 w-full flex justify-center">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-[70%]">
              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <>
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            icon={
                              <>
                                <TfiEmail size={20} color="#000" />
                              </>
                            }
                            height="h-12"
                            placeholder="Insira seu e-mail"
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    </>
                  )}
                />
              </div>

              <div className="mb-3">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <>
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input
                            icon={
                              <>
                                <CiLock size={20} color="#000" />
                              </>
                            }
                            type="password"
                            height="h-12"
                            placeholder="Insira sua senha"
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    </>
                  )}
                />
              </div>
              <div className="mb-7">
                <button
                  type="button"
                  onClick={() => forgotPasswordModal.onOpen()}
                >
                  <h1 className="text-md">Esqueceu a senha?</h1>
                </button>
              </div>
              <div className="w-full flex justify-center">
                <Button
                  className="bg-[#081c15] w-full "
                  size={"lg"}
                  type="submit"
                >
                  {loading ? <Loader /> : "ACESSAR"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
}
