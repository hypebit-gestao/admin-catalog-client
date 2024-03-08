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

import { useRouter } from "next/navigation";
import { Textarea } from "../ui/textarea";
import useCategoryUpdateModal from "@/utils/hooks/category/useUpdateCategoryModal";
import { Category } from "@/models/category";
import Loader from "../loader";
import { useUploadService } from "@/services/upload.service";
import { ReturnUpload } from "@/models/upload";
import Image from "next/image";
import { TiDelete } from "react-icons/ti";

interface CategoryUpdateProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório"),
  description: z.string().min(1, "Descrição da categoria é obrigatório"),
  image_url: z.any(),
});

const CategoryEdit = ({ isOpen, onClose }: CategoryUpdateProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const inputFileRef = useRef<any>(null);
  const [filePreview, setFilePreview] = useState<any>(null);
  const categoryService = useCategoryService();
  const uploadService = useUploadService();
  const categoryEditModal = useCategoryUpdateModal();
  const [category, setCategory] = useState<Category>();
  const [loading, setLoading] = useState(false);

  const handleDeleteFile = () => {
    if (inputFileRef.current) {
      inputFileRef.current.value = "";
    }
    setCustomValue("image_url", "");
    setFilePreview(null);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      image_url: "",
    },
  });

  const { setValue } = form;

  type FormSchemaType = z.infer<typeof formSchema>;

  type FormField = keyof FormSchemaType;

  const setCustomValue = (id: FormField, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  useEffect(() => {
    setLoading(true);
    const getCategory = async () => {
      const fetchedCategory = await categoryService.GETBYID(
        session?.user.accessToken,
        categoryEditModal.itemId
      );

      if (fetchedCategory) {
        if (fetchedCategory.id === categoryEditModal.itemId) {
          setCategory(fetchedCategory);
          setCustomValue("name", fetchedCategory.name);
          setCustomValue("description", fetchedCategory.description);
          setCustomValue("image_url", fetchedCategory.image_url);
          if (fetchedCategory.image_url) {
            setFilePreview(fetchedCategory.image_url);
          }
          setLoading(false);
        }
      }
    };

    getCategory();
  }, [session?.user.accessToken, categoryEditModal.itemId]);

  const onUpdate = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    try {
      if (data?.image_url) {
        await uploadService
          .POST({
            file: data.image_url,
            folderName: data.name,
          })
          .then(async (res: ReturnUpload | undefined) => {
            if (Array.isArray(res) && res.length > 0 && res[0].imageUrl) {
              await categoryService.PUT(
                {
                  ...data,
                  id: category?.id,
                  image_url: res[0].imageUrl,
                },
                session?.user.accessToken
              );
            }
          });
      } else {
        await categoryService.PUT(
          {
            ...data,
            id: category?.id,
          },
          session?.user.accessToken
        );
      }

      useCategoryUpdateModal.setState({ isUpdate: true });
      toast.success(`${data.name} criado com sucesso`);
      setLoading(false);
      categoryEditModal.onClose();
      router.refresh();
    } catch (error) {
      setLoading(false);
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (category?.image_url === "") {
      setFilePreview(null);
    }
    if (category?.image_url !== "") {
      setFilePreview(category?.image_url);
    }
  }, [category]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-primary-blue font-bold text-xl">
            Editar Categoria
          </h1>
        </>
      }
      body={
        <>
          {loading ? (
            <Loader color="text-green-primary" />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onUpdate)} className=" w-full">
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

                  <div className="flex flex-col lg:flex-row ">
                    <div className="w-full ">
                      <FormField
                        control={form.control}
                        name="image_url"
                        render={({
                          field: { value, onChange, ...fieldProps },
                        }) => (
                          <FormItem>
                            <FormLabel>Logo da Loja</FormLabel>
                            <FormControl>
                              <Input
                                {...fieldProps}
                                ref={inputFileRef}
                                placeholder="Logo da Loja"
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

                                      reader.readAsDataURL(
                                        event.target.files[0]
                                      );
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

                                <Image
                                  className=""
                                  src={filePreview}
                                  alt="Preview"
                                  width={300}
                                  height={300}
                                />
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
                  <Button
                    size="lg"
                    className={`w-full ${loading && "cursor-not-allowed"}`}
                    type="submit"
                  >
                    {loading ? <Loader /> : "Atualizar"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </>
      }
    />
  );
};

export default CategoryEdit;
