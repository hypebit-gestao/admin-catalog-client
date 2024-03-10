"use client";

import React, { useEffect, useState } from "react";
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
import useCategoryRegisterModal from "@/utils/hooks/category/useRegisterCategoryModal";
import useCategoryDeleteModal from "@/utils/hooks/category/useDeleteCategoryModal";

interface CategoryUpdateProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório"),
  description: z.string().min(1, "Descrição da categoria é obrigatório"),
});

const CategoryEdit = ({ isOpen, onClose }: CategoryUpdateProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const categoryService = useCategoryService();
  const categoryEditModal = useCategoryUpdateModal();
  const [category, setCategory] = useState<Category>();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
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
          setLoading(false);
        }
      }
    };

    getCategory();
  }, [session?.user.accessToken, categoryEditModal.itemId]);

  const onUpdate = async (data: z.infer<typeof formSchema>) => {
    try {
      await categoryService.PUT(
        {
          ...data,
          id: category?.id,
        },
        session?.user.accessToken
      );

      useCategoryUpdateModal.setState({ isUpdate: true });
      toast.success(`${data.name} criado com sucesso`);
      categoryEditModal.onClose();
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    useCategoryRegisterModal.setState({ isRegister: false });
    useCategoryUpdateModal.setState({ isUpdate: false });
    useCategoryDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

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
                  <Button size="lg" className="w-full" type="submit">
                    Atualizar
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
