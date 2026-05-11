"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useSizeService } from "@/services/size.service";
import { useRouter } from "next/navigation";
import Loader from "@/components/loader";
import ContentMain from "@/components/content-main";
import { useUnsavedChanges } from "@/utils/hooks/useUnsavedChanges";

const formSchema = z.object({
  size: z.string().min(1, "Tamanho é obrigatório"),
});

const SizeNewPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const sizeService = useSizeService();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { size: "" },
  });

  const { confirmLeave } = useUnsavedChanges(form.formState.isDirty);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    try {
      await sizeService.POST(
        { size: data.size, user_id: session?.user?.user?.id },
        session?.user?.accessToken
      );
      toast.success(`Tamanho ${data.size} criado com sucesso`);
      router.push("/size");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentMain title="Novo Tamanho" subtitle="Preencha as informações do tamanho">
      <div className="max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
            <div>
              <h2 className="my-4 font-semibold text-green-primary">Informações do tamanho</h2>
              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-primary">Tamanho</FormLabel>
                      <FormControl>
                        <Input placeholder="Insira o nome do tamanho" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => { if (confirmLeave()) router.push("/size"); }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-primary hover:bg-green-primary/90"
              >
                {loading ? <Loader /> : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ContentMain>
  );
};

export default SizeNewPage;
