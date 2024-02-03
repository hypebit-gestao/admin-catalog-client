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

const formSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(4),
});

export default function Home() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    signIn("credentials", {
      ...values,
      redirect: false,
    }).then((callback: any) => {
      if (callback.ok) {
        router.push("/home");
        toast.success("Logado com sucesso");
      } else {
        toast.error(callback.error);
      }
    });
  };

  return (
    <main className="bg-[#081c15] min-h-screen flex justify-center items-center">
      <div className="bg-[#f2f4f3] rounded-lg p-6 w-1/3">
        <h1 className="text-center font-bold text-blue-primary text-2xl">
          LOGIN
        </h1>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <>
                    <FormItem>
                      <FormLabel>Nome de usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Insira o username" {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  </>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <>
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Insira a senha"
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  </>
                )}
              />
              <div className="flex justify-center">
                <Button className="bg-[#081c15]" size={"xl"} type="submit">
                  Entrar
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
}
