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
import { useCategoryService } from "@/services/category.service";
import { useUploadService } from "@/services/upload.service";
import { ReturnUpload } from "@/models/upload";
import { useParams, useRouter } from "next/navigation";
import { TiDelete } from "react-icons/ti";
import { MdCloudUpload } from "react-icons/md";
import Image from "next/image";
import Loader from "@/components/loader";
import ContentMain from "@/components/content-main";
import { FormSkeleton } from "@/components/ui/skeleton";
import { Category } from "@/models/category";
import { useUnsavedChanges } from "@/utils/hooks/useUnsavedChanges";

const formSchema = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório"),
  image_url: z.any(),
});

const CategoryEditPage = () => {
  const { data: session } = useSession();
  const params = useParams()!;
  const categoryId = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [category, setCategory] = useState<Category>();

  const categoryService = useCategoryService();
  const uploadService = useUploadService();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", image_url: "" },
  });

  const { setValue } = form;
  const { confirmLeave } = useUnsavedChanges(form.formState.isDirty);

  const setCustomValue = (id: keyof z.infer<typeof formSchema>, value: any) => {
    setValue(id, value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  useEffect(() => {
    if (!session?.user?.accessToken || !categoryId) return;

    const fetchCategory = async () => {
      setLoading(true);
      const fetched = await categoryService.GETBYID(
        session.user.accessToken,
        categoryId
      );
      if (fetched) {
        setCategory(fetched);
        setCustomValue("name", fetched.name);
        setCustomValue("image_url", fetched.image_url ?? "");
        if (fetched.image_url) setFilePreview(fetched.image_url);
      }
      setLoading(false);
    };

    fetchCategory();
  }, [session?.user?.accessToken, categoryId]);

  const processFile = (file: File) => {
    setCustomValue("image_url", file);
    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDeleteFile = () => {
    setCustomValue("image_url", "");
    setFilePreview(null);
  };

  const onUpdate = async (data: z.infer<typeof formSchema>) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (data.image_url && typeof data.image_url !== "string") {
        const res: ReturnUpload | undefined = await uploadService.POST({
          file: data.image_url,
          folderName: data.name,
        });
        if (Array.isArray(res) && res.length > 0 && res[0].imageUrl) {
          await categoryService.PUT(
            { ...data, id: category?.id, image_url: res[0].imageUrl },
            session?.user?.accessToken
          );
        }
      } else {
        await categoryService.PUT(
          { ...data, id: category?.id },
          session?.user?.accessToken
        );
      }

      toast.success(`${data.name} atualizado com sucesso`);
      router.push("/category");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ContentMain title="Editar Categoria">
        <FormSkeleton rows={3} />
      </ContentMain>
    );
  }

  return (
    <ContentMain
      title="Editar Categoria"
      subtitle={category?.name ?? "Carregando..."}
    >
      <div className="max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onUpdate)} className="w-full">
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
              <FormItem>
                <FormLabel>Imagem da Categoria</FormLabel>
                {filePreview ? (
                  <div className="relative mt-2 w-[300px]">
                    <button
                      type="button"
                      className="absolute top-0 right-0 z-10"
                      onClick={handleDeleteFile}
                    >
                      <TiDelete color="red" size={24} />
                    </button>
                    <Image
                      src={filePreview}
                      alt="Preview"
                      width={300}
                      height={300}
                      className="rounded-md"
                    />
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file?.type.startsWith("image/")) processFile(file);
                    }}
                    onClick={() => document.getElementById("cat-edit-image-input")?.click()}
                    className={`mt-2 border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors
                      ${isDragging ? "border-green-primary bg-green-primary/5" : "border-gray-200 bg-gray-50 hover:border-green-primary/50"}`}
                  >
                    <MdCloudUpload size={36} className="text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Arraste uma imagem ou{" "}
                      <span className="text-green-primary underline underline-offset-2">clique para selecionar</span>
                    </p>
                  </div>
                )}
                <input
                  id="cat-edit-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
                />
              </FormItem>
            </div>

            <div className="mt-10 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => { if (confirmLeave()) router.push("/category"); }}
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

export default CategoryEditPage;
