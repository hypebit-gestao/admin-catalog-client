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
import { Address } from "@/models/address";
import { useAddressService } from "@/services/address.service";
import { useUserService } from "@/services/user.service";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useUploadService } from "@/services/upload.service";
import { ReturnUpload, Upload } from "@/models/upload";
import { useProductService } from "@/services/product.service";
import { useCategoryService } from "@/services/category.service";
import { Category } from "@/models/category";
import { User } from "@/models/user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useProductRegisterModal from "@/utils/hooks/product/useRegisterProductModal";
import { useRouter } from "next/navigation";
import { TiDelete } from "react-icons/ti";
import Image from "next/image";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";
import Loader from "../loader";

interface ProductRegisterProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().min(1, "Descrição do produto é obrigatório"),
  category_id: z.string().min(1, "Categoria do produto é obrigatório"),
  images: z.any(),
  featured: z.boolean(),
  active: z.boolean(),
  currency: z.string(),
  isPromotion: z.boolean(),
  promotion_price: z.string(),
  price: z.string().min(1, "Preço do produto é obrigatório"),
  user_id: z.string().min(1, "Usuário do produto é obrigatório"),
});

const ProductRegister = ({ isOpen, onClose }: ProductRegisterProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const userService = useUserService();
  const productService = useProductService();
  const categoryService = useCategoryService();
  const uploadService = useUploadService();
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User>();
  const productRegisterModal = useProductRegisterModal();
  const router = useRouter();
  const [filePreviews, setFilePreviews] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      images: "",
      currency: "",
      featured: false,
      active: true,
      isPromotion: false,
      price: "",
      promotion_price: "",
      user_id: session?.user?.user?.name,
    },
  });

  const resetForm = () => {
    form.reset();
    setFilePreviews([]);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleDeleteFile = (index: number) => {
    const newPreviews = [...filePreviews];
    newPreviews.splice(index, 1);
    setFilePreviews(newPreviews);
  };

  useEffect(() => {
    const getUser = async () => {
      const fetchedUser = await userService.GETBYID(
        session?.user?.user?.id,
        session?.user.accessToken
      );
      if (fetchedUser) {
        setUsers(fetchedUser);
      }
    };

    const getCategories = async () => {
      const fetchedCategories = await categoryService.GETALL(
        session?.user.accessToken,
        session?.user?.user?.id
      );
      if (fetchedCategories) {
        setCategories(fetchedCategories);
      }
    };

    getUser();
    getCategories();
  }, [session?.user?.accessToken]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const uploadedImagesUrls: string[] = []; // Array para armazenar as URLs dos arquivos

      if (data.images.length > 0) {
        for (let i = 0; i < data.images.length; i++) {
          const file = data.images[i];

          await uploadService
            .POST({
              file,
              folderName: session?.user?.user?.name,
            })
            .then(async (res: any) => {
              res?.map((item: any) => {
                if (item?.imageUrl) {
                  uploadedImagesUrls.push(item.imageUrl);
                }
              });

              if (i === data.images.length - 1) {
                await productService.POST(
                  {
                    name: data.name,
                    category_id: data.category_id,
                    images: uploadedImagesUrls,
                    currency: "brl",
                    price: Number(data.price),
                    promotion_price: Number(data.promotion_price),
                    user_id: session?.user?.user?.id,
                    featured: data.featured,
                    active: data.active,
                    description: data.description,
                  },
                  session?.user?.accessToken
                );
              }
            });
        }
      } else {
        await productService.POST(
          {
            name: data.name,
            category_id: data.category_id,
            images: null,
            currency: "brl",
            price: Number(data.price),
            promotion_price: Number(data.promotion_price),
            user_id: session?.user?.user?.id,
            featured: data.featured,
            active: data.active,
            description: data.description,
          },
          session?.user?.accessToken
        );
      }

      useProductRegisterModal.setState({ isRegister: true });
      toast.success(`${data.name} criado com sucesso`);
      setLoading(false);
      productRegisterModal.onClose();
      router.refresh();
    } catch (error) {
      setLoading(false);
      toast.error((error as Error).message);
    }
  };

  const { setValue, watch } = form;

  const isPromotion = watch("isPromotion");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-[#2c6e49] font-bold text-xl">
            Cadastro de Produto
          </h1>
        </>
      }
      body={
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=" w-full">
              <div>
                <h1 className="my-4 font-semibold text-green-primary">
                  Informações do produto
                </h1>
                <div className="flex flex-row mb-5">
                  <div className="w-full mr-5">
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
                              placeholder="Insira o nome do produto"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row mb-5">
                  <div className="w-full mb-5 lg:mb-0 lg:mr-5">
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria do produto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[300]">
                              {categories.map((category, index) => (
                                <SelectItem
                                  key={index}
                                  value={category.category?.id as string}
                                >
                                  {category.category?.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="user_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuário</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={session?.user?.user?.name}
                            disabled
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[300]">
                              <SelectItem
                                disabled
                                defaultValue={session?.user?.user?.name}
                                value={session?.user?.user?.name}
                              >
                                {session?.user?.user?.name}
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <h1 className="font-bold">
                    Seu produto possui preço promocional?
                  </h1>
                </div>
                <div className="mb-5">
                  <FormField
                    control={form.control}
                    name="isPromotion"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col">
                          <FormControl>
                            <div className="flex flex-row items-center">
                              <Checkbox
                                color="blue"
                                className="w-5 h-5"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </div>
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col lg:flex-row mb-5">
                  {isPromotion && (
                    <div className="w-full mb-5 lg:mb-0 lg:mr-5">
                      <FormField
                        control={form.control}
                        name="promotion_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              Preço Promocional
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Insira o preço promocional"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Preço
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Insira o preço do produto"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex flex-row mb-5">
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descrição do produto"
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
                <div className="flex flex-row mb-5">
                  <div className="w-full ">
                    <FormField
                      control={form.control}
                      name="images"
                      render={({
                        field: { value, onChange, ...fieldProps },
                      }) => (
                        <FormItem>
                          <FormLabel>Imagens do produto</FormLabel>
                          <FormControl>
                            <Input
                              {...fieldProps}
                              placeholder="Imagens"
                              type="file"
                              accept="image/*, application/pdf"
                              onChange={(event: any) => {
                                onChange(event.target.files);
                                const files = event.target.files;

                                if (files && files.length > 0) {
                                  const newPreviews = Array.from(files).map(
                                    (file: any) => {
                                      const blob = new Blob([file], {
                                        type: file.type,
                                      });
                                      return {
                                        file,
                                        preview: URL.createObjectURL(blob),
                                      };
                                    }
                                  );

                                  setFilePreviews([
                                    ...filePreviews,
                                    ...newPreviews,
                                  ]);
                                }
                              }}
                              multiple
                            />
                          </FormControl>
                          <div className="grid grid-cols-2 gap-4">
                            {filePreviews.map((preview, index) => (
                              <div
                                key={index}
                                className="relative mt-3 w-[300px]"
                              >
                                <div
                                  className="absolute top-0 right-0 cursor-pointer"
                                  onClick={() => handleDeleteFile(index)}
                                >
                                  <TiDelete color="red" size={24} />
                                </div>

                                {preview.file.type.startsWith("image") ? (
                                  <Image
                                    className="w-[300px] h-[300px]"
                                    src={preview.preview}
                                    alt={`Preview ${index + 1}`}
                                    width={300}
                                    height={300}
                                  />
                                ) : (
                                  <p>Arquivo selecionado: {preview.preview}</p>
                                )}
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div>
                  <FormLabel>Status</FormLabel>
                  <div>
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex flex-col">
                            <FormControl>
                              <div className="flex flex-row mt-5 items-center">
                                <Checkbox
                                  color="blue"
                                  className="w-5 h-5"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <div className="ml-2">Produto ativo</div>
                              </div>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex flex-col">
                            <FormControl>
                              <div className="flex flex-row mt-5 items-center">
                                <Checkbox
                                  color="blue"
                                  className="w-5 h-5"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <div className="ml-2">Produto em destaque</div>
                              </div>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <Button size="lg" className="w-full" type="submit">
                  {loading ? <Loader /> : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </>
      }
    />
  );
};

export default ProductRegister;
