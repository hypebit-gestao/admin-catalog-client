"use client";

import React, { useEffect, useState } from "react";
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
import { useParams, useRouter } from "next/navigation";
import Loader from "@/components/loader";
import ContentMain from "@/components/content-main";
import { Size } from "@/models/size";

const formSchema = z.object({
  size: z.string().min(1, "Tamanho é obrigatório"),
});

const SizeEditPage = () => {
  const { data: session } = useSession();
  const params = useParams()!;
  const sizeId = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [size, setSize] = useState<Size>();

  const sizeService = useSizeService();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { size: "" },
  });

  const { setValue } = form;

  useEffect(() => {
    if (!session?.user?.accessToken || !sizeId) return;

    const fetchSize = async () => {
      setLoading(true);
      const fetched = await sizeService.GETBYID(session.user.accessToken, sizeId);
      if (fetched) {
        setSize(fetched);
        setValue("size", fetched.size ?? "", {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      setLoading(false);
    };

    fetchSize();
  }, [session?.user?.accessToken, sizeId]);

  const onUpdate = async (data: z.infer<typeof formSchema>) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await sizeService.PUT(
        { ...data, id: size?.id },
        session?.user?.accessToken
      );
      toast.success("Tamanho atualizado com sucesso");
      router.push("/size");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ContentMain title="Editar Tamanho">
        <div className="flex justify-center py-20">
          <Loader color="text-green-primary" />
        </div>
      </ContentMain>
    );
  }

  return (
    <ContentMain
      title="Editar Tamanho"
      subtitle={size?.size ?? "Carregando..."}
    >
      <div className="max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onUpdate)} className="w-full">
            <div>
              <h2 className="my-4 font-semibold text-green-primary">
                Informações do tamanho
              </h2>
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
                onClick={() => router.push("/size")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-primary hover:bg-green-primary/90"
              >
                {submitting ? <Loader /> : "Atualizar"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ContentMain>
  );
};

export default SizeEditPage;
