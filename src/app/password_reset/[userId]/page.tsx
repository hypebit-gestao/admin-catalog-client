"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthService } from "@/services/auth.service";
import toast from "react-hot-toast";
import Loader from "@/components/loader";

const formSchema = z
  .object({
    password: z.string().min(1, "Senha é obrigatório"),
    confirmation_password: z
      .string()
      .min(1, "Confirmação de senha é obrigatório"),
  })
  .refine((data) => data.password === data.confirmation_password, {
    message: "As senhas não coincidem",
    path: ["confirmation_password"],
  });

const PasswordReset = () => {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const authService = useAuthService();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  });
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    if (params?.userId) {
      await authService
        .RESETPASSWORD(params.userId, data.password)
        .then((res) => {
          setLoading(false);
          toast.success(res.message);
          router.push("/");
        })
        .catch((err) => {
          setLoading(false);
          toast.error(err.message);
          console.log(err);
        });
    }
  };
  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-green-primary">
      <div className="flex flex-col w-[30%] items-center">
        <h1 className="font-bold text-3xl mb-6 text-white">
          Redefinição de Senha
        </h1>
        <div className="rounded-xl shadow-xl  w-full p-6 bg-white">
          <div className=" w-full">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className=" w-full">
                <div>
                  <div className="w-full mb-3">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Escolha sua nova senha
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Senha"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="confirmation_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Confirme sua senha
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Senha"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <Button size="lg" className="w-full" type="submit">
                    {loading ? <Loader /> : "Alterar"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
