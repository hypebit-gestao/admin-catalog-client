"use client";

import React, { useRef, useState } from "react";
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
import { useCategoryService } from "@/services/category.service";
import { useUploadService } from "@/services/upload.service";
import { ReturnUpload } from "@/models/upload";
import { useRouter } from "next/navigation";
import { TiDelete } from "react-icons/ti";
import Image from "next/image";
import Loader from "@/components/loader";
import ContentMain from "@/components/content-main";

const formSchema = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório"),
  image_url: z.any().optional(),
});

const CategoryNewPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const inputFileRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<any>(null);

  const categoryService = useCategoryService();
  const uploadService = useUploadService();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", image_url: "" },
  });

  const { setValue } = form;

  const setCustomValue = (id: keyof z.infer<typeof formSchema>, value: any) => {
    setValue(id, value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  const handleDeleteFile = () => {
    if (inputFileRef.current) inputFileRef.current.value = "";
    setCustomValue("image_url", "");
    setFilePreview(null);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);

    try {
      if (data.image_url) {
        const res: ReturnUpload | undefined = await uploadService.POST({
          file: data.image_url,
          folderName: session?.user?.user?.name,
        });
        if (Array.isArray(res) && res.length > 0 && res[0].imageUrl) {
          await categoryService.POST(
            { name: data.name, user_id: session?.user?.user?.id, image_url: res[0].imageUrl },
            session?.user?.accessToken
          );
        }
      } else {
        await categoryService.POST(
          { name: data.name, user_id: session?.user?.user?.id },
          session?.user?.accessToken
        );
      }

      toast.success(`${data.name} criado com sucesso`);
      router.push("/category");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentMain title="Nova Categoria" subtitle="Preencha as informações da categoria">
      <div className="max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
            <div>
              <h2 className="my-4 font-semibold text-green-primary">
                Informações da categoria
              </h2>
              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-primary">Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Insira o nome da categoria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="mt-8">
              <h2 className="my-4 font-semibold text-green-primary">
                Informações adicionais
              </h2>
              <FormField
                control={form.control}
                name="image_url"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Imagem da Categoria</FormLabel>
                    <FormControl>
                      <Input
                        {...fieldProps}
                        ref={inputFileRef}
                        type="file"
                        accept="image/*, application/pdf"
                        onChange={(event) => {
                          onChange(event.target.files && event.target.files[0]);
                          if (event.target.files?.[0]) {
                            const reader = new FileReader();
                            reader.onloadend = () => setFilePreview(reader.result);
                            reader.readAsDataURL(event.target.files[0]);
                          }
                        }}
                      />
                    </FormControl>
                    {filePreview && (
                      <div className="relative mt-3 w-[300px]">
                        <div
                          className="absolute top-0 right-0 cursor-pointer"
                          onClick={handleDeleteFile}
                        >
                          <TiDelete color="red" size={24} />
                        </div>
                        {filePreview.startsWith("data:image") ? (
                          <Image
                            src={filePreview}
                            alt="Preview"
                            width={300}
                            height={300}
                          />
                        ) : (
                          <p>Arquivo selecionado</p>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-10 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/category")}
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

export default CategoryNewPage;
