"use client";

import React, { useEffect, useRef, useState } from "react";
import Modal from "../modal";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import { Button } from "../ui/button";

import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import { useCategoryService } from "@/services/category.service";

import useCategoryRegisterModal from "@/utils/hooks/category/useRegisterCategoryModal";
import { useRouter } from "next/navigation";
import { TiDelete } from "react-icons/ti";
import Image from "next/image";
import { Textarea } from "../ui/textarea";
import { useUploadService } from "@/services/upload.service";
import { ReturnUpload } from "@/models/upload";

interface CategoryRegisterProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório"),
  description: z.string().min(1, "Descrição da categoria é obrigatório"),
  image_url: z.any(),
});

const CategoryRegister = ({ isOpen, onClose }: CategoryRegisterProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const inputFileRef = useRef<any>(null);
  const [filePreview, setFilePreview] = useState<any>(null);

  const categoryService = useCategoryService();
  const uploadService = useUploadService();
  const categoryRegisterModal = useCategoryRegisterModal();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      image_url: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (data.image_url) {
        await uploadService
          .POST({
            file: data.image_url,
            folderName: data.name,
          })
          .then(async (res: ReturnUpload | undefined) => {
            if (Array.isArray(res) && res.length > 0 && res[0].imageUrl) {
              const categoryResponse = await categoryService.POST(
                {
                  name: data.name,
                  description: data.description,
                  user_id: session?.user?.user?.id,
                  image_url: res[0].imageUrl,
                },
                session?.user?.accessToken
              );

              if (categoryResponse) {
                await categoryService.POSTUSERCATEGORY(
                  {
                    user_id: session?.user?.user?.id,
                    category_id: categoryResponse.id,
                  },
                  session?.user?.accessToken
                );
              }
            }
          });
      } else {
        const categoryResponse = await categoryService.POST(
          {
            name: data.name,
            description: data.description,
            user_id: session?.user?.user?.id,
          },
          session?.user?.accessToken
        );

        if (categoryResponse) {
          await categoryService.POSTUSERCATEGORY(
            {
              user_id: session?.user?.user?.id,
              category_id: categoryResponse.id,
            },
            session?.user?.accessToken
          );
        }
      }

      toast.success(`${data.name} criado com sucesso`);
      categoryRegisterModal.onClose();
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const { setValue, watch } = form;

  type FormSchemaType = z.infer<typeof formSchema>;

  type FormField = keyof FormSchemaType;

  const setCustomValue = (id: FormField, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleDeleteFile = () => {
    if (inputFileRef.current) {
      inputFileRef.current.value = "";
    }
    setCustomValue("image_url", "");
    setFilePreview(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-[#2c6e49] font-bold text-xl">
            Cadastro de Categoria
          </h1>
        </>
      }
      body={
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=" w-full">
              <div>
                <h1 className="my-4 font-semibold text-green-primary">
                  Informações da categoria
                </h1>
                <div className="flex flex-row mb-5">
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Nome
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Insira o nome da categoria"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex flex-row">
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Descrição
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descrição da Categoria"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <h1 className="my-4 font-semibold text-green-primary">
                  Informações adicionais
                </h1>

                <div className="flex flex-row ">
                  <div className="w-full ">
                    <FormField
                      control={form.control}
                      name="image_url"
                      render={({
                        field: { value, onChange, ...fieldProps },
                      }) => (
                        <FormItem>
                          <FormLabel>Imagem da Categoria</FormLabel>
                          <FormControl>
                            <Input
                              {...fieldProps}
                              ref={inputFileRef}
                              placeholder="Imagem da categoria"
                              type="file"
                              accept="image/*, application/pdf"
                              onChange={(event) => {
                                onChange(
                                  event.target.files && event.target.files[0]
                                );
                                if (event.target.files) {
                                  if (event.target.files[0]) {
                                    const reader = new FileReader();

                                    reader.onloadend = () => {
                                      setFilePreview(reader.result);
                                    };

                                    reader.readAsDataURL(event.target.files[0]);
                                  }
                                }
                              }}
                            />
                          </FormControl>
                          {filePreview && (
                            <div className="relative mt-3 w-[300px] ">
                              <div
                                className="absolute top-0 right-0 cursor-pointer"
                                onClick={handleDeleteFile}
                              >
                                <TiDelete color="red" size={24} />
                              </div>

                              {filePreview.startsWith("data:image") ? (
                                <Image
                                  className=""
                                  src={filePreview}
                                  alt="Preview"
                                  width={300}
                                  height={300}
                                />
                              ) : (
                                <p>Arquivo selecionado: {filePreview}</p>
                              )}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <Button size="lg" className="w-full" type="submit">
                  Cadastrar
                </Button>
              </div>
            </form>
          </Form>
        </>
      }
    />
  );
};

export default CategoryRegister;
