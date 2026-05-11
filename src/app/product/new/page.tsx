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
import { Input, InputCurrency } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useUploadService } from "@/services/upload.service";
import { useProductService } from "@/services/product.service";
import { useCategoryService } from "@/services/category.service";
import { Category } from "@/models/category";
import { LuMoveLeft, LuMoveRight } from "react-icons/lu";
import Select from "react-select";
import {
  Select as SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { TiDelete } from "react-icons/ti";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/loader";
import { IoMdAdd } from "react-icons/io";
import { useSizeService } from "@/services/size.service";
import { Size } from "@/models/size";
import { useAttributeService } from "@/services/attribute.service";
import { Attribute } from "@/models/attribute";
import ContentMain from "@/components/content-main";

const formSchema = z
  .object({
    name: z.string().min(1, "Nome do produto é obrigatório"),
    description: z.string().optional(),
    category_id: z.string().nullable(),
    size_ids: z.any(),
    attribute_ids: z.any(),
    images: z.any(),
    featured: z.boolean(),
    active: z.boolean(),
    currency: z.string(),
    isPromotion: z.boolean(),
    isSize: z.boolean(),
    isAttribute: z.boolean(),
    promotion_price: z.string(),
    price: z.string().min(1, "Preço do produto é obrigatório"),
    installment_available: z.boolean(),
    installment_with_interest: z.boolean(),
    installment_interest_value: z.string().optional(),
    max_installments: z.string().optional(),
    user_name: z.string(),
  })
  .refine((data) => Number(data.promotion_price) <= Number(data.price), {
    message: "O preço promocional não pode ser maior que o preço normal",
    path: ["promotion_price"],
  })
  .refine((data) => Number(data.price) >= Number(data.promotion_price), {
    message: "O preço normal não pode ser menor que o preço promocional",
    path: ["price"],
  })
  .refine(
    (data) =>
      !data.installment_available ||
      !data.installment_with_interest ||
      (data.installment_interest_value !== undefined &&
        data.installment_interest_value !== "" &&
        Number(data.installment_interest_value) > 0 &&
        Number(data.installment_interest_value) <= 100),
    {
      message: "O valor do juros deve ser maior que 0 e menor ou igual a 100",
      path: ["installment_interest_value"],
    }
  );

const ProductNewPage = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const productService = useProductService();
  const categoryService = useCategoryService();
  const uploadService = useUploadService();
  const sizeService = useSizeService();
  const attributeService = useAttributeService();
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const router = useRouter();
  const [filePreviews, setFilePreviews] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      size_ids: [],
      attribute_ids: [],
      images: "",
      currency: "",
      featured: false,
      active: true,
      isPromotion: false,
      isSize: false,
      isAttribute: false,
      price: "",
      promotion_price: "",
      installment_available: false,
      installment_with_interest: false,
      installment_interest_value: "",
      max_installments: "1",
      user_name: session?.user?.user?.name ?? "",
    },
  });

  const { setValue, watch } = form;
  const isPromotion = watch("isPromotion");
  const isSize = watch("isSize");
  const installmentAvailable = watch("installment_available");
  const installmentWithInterest = watch("installment_with_interest");

  useEffect(() => {
    if (!session?.user?.accessToken) return;

    categoryService.GETALL(session.user.accessToken).then((res) => {
      if (res) setCategories(res);
    });
    sizeService.GETALL(session.user.accessToken).then((res) => {
      if (res) setSizes(res);
    });
    attributeService.GETALL(session.user.accessToken).then((res) => {
      if (res) setAttributes(res);
    });
  }, [session?.user?.accessToken]);

  const handleDeleteFile = (index: number) => {
    const updated = [...filePreviews];
    updated.splice(index, 1);
    setFilePreviews(updated);
  };

  const handleMoveDown = (index: number) => {
    const updated = [...filePreviews];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setFilePreviews(updated);
    setValue("images", updated.map((p) => p.file));
  };

  const handleMoveUp = (index: number) => {
    const updated = [...filePreviews];
    [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
    setFilePreviews(updated);
    setValue("images", updated.map((p) => p.file));
  };

  const options = sizes.map((size) => ({ value: size.id, label: size.size }));

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    data.images = filePreviews.map((p) => p.file);
    if (loading) return;
    setLoading(true);

    const uploadedUrls: string[] = [];

    try {
      for (const file of data.images) {
        const res: any = await uploadService.POST({
          file,
          folderName: session?.user?.user?.name,
        });
        res?.forEach((item: any) => {
          if (item?.imageUrl) uploadedUrls.push(item.imageUrl);
        });
      }

      await productService.POST(
        {
          name: data.name,
          category_id: data.category_id !== "" ? data.category_id : null,
          images: uploadedUrls.length > 0 ? uploadedUrls : null,
          currency: "brl",
          price: Number(data.price),
          promotion_price: Number(data.promotion_price),
          user_id: session?.user?.user?.id,
          featured: data.featured,
          active: data.active,
          description: data.description ?? "",
          archived: false,
          installment_available: data.installment_available,
          installment_with_interest: data.installment_available
            ? data.installment_with_interest
            : false,
          installment_interest_value:
            data.installment_available && data.installment_with_interest
              ? Number(data.installment_interest_value)
              : null,
          max_installments: data.installment_available
            ? Number(data.max_installments ?? 1)
            : 1,
        },
        session?.user?.accessToken
      );

      toast.success(`${data.name} criado com sucesso`);
      router.push("/product");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentMain title="Novo Produto" subtitle="Preencha as informações do produto">
      <div className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
            {/* Informações do produto */}
            <div>
              <h2 className="my-4 font-semibold text-green-primary">
                Informações do produto
              </h2>

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-primary">Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Insira o nome do produto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col lg:flex-row gap-5 mb-5">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <SelectComponent
                          onValueChange={(value) =>
                            field.onChange(value === "null" ? null : value)
                          }
                          defaultValue="null"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[300]">
                            <SelectItem value="null">Sem categoria</SelectItem>
                            {categories.map((category, i) => (
                              <SelectItem key={i} value={category.id as string}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </SelectComponent>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex-1">
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <SelectComponent
                      disabled
                      defaultValue={session?.user?.user?.name}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={session?.user?.user?.name ?? ""}>
                          {session?.user?.user?.name}
                        </SelectItem>
                      </SelectContent>
                    </SelectComponent>
                  </FormItem>
                </div>
              </div>

              <div className="mb-3">
                <h3 className="font-bold">
                  Seu produto possui preço promocional?
                </h3>
              </div>
              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="isPromotion"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox
                          className="w-5 h-5"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col lg:flex-row gap-5 mb-5">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-primary">Preço</FormLabel>
                        <FormControl>
                          <InputCurrency
                            placeholder="Preço do produto"
                            type="number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {isPromotion && (
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="promotion_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Preço Promocional
                          </FormLabel>
                          <FormControl>
                            <InputCurrency
                              placeholder="Preço Promocional"
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="mb-5">
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

            {/* Informações adicionais */}
            <div className="mt-8">
              <h2 className="my-4 font-semibold text-green-primary">
                Informações adicionais
              </h2>

              <div className="mb-3">
                <h3 className="font-bold">Seu produto possui tamanho?</h3>
              </div>
              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="isSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox
                          className="w-5 h-5"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isSize && (
                <div className="mb-5">
                  <FormField
                    control={form.control}
                    name="size_ids"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamanho</FormLabel>
                        <Select
                          styles={{
                            control: (provided) => ({
                              ...provided,
                              border: "1px solid #e2e8f0",
                              borderRadius: "0.375rem",
                              padding: "0.2rem",
                              fontSize: "0.875rem",
                              boxShadow: "none",
                              "&:hover": { cursor: "pointer" },
                            }),
                            option: (provided, state) => ({
                              ...provided,
                              backgroundColor: state.isSelected ? "#2c6e49" : "#fff",
                              color: state.isSelected ? "#fff" : "#374151",
                              "&:hover": {
                                backgroundColor: "#2c6e49",
                                color: "#fff",
                              },
                            }),
                            indicatorSeparator: (provided) => ({
                              ...provided,
                              display: "none",
                            }),
                            dropdownIndicator: (provided) => ({
                              ...provided,
                              color: "#9ca3af",
                            }),
                          }}
                          isMulti
                          placeholder="Selecione os tamanhos do produto"
                          options={options}
                          {...field}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="mb-3">
                <h3 className="font-bold">Parcelamento</h3>
              </div>
              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="installment_available"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            className="w-5 h-5"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span>Parcelamento disponível</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {installmentAvailable && (
                <div className="mb-5 space-y-3">
                  <FormField
                    control={form.control}
                    name="installment_with_interest"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              className="w-5 h-5"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span>Com juros</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {installmentWithInterest && (
                    <FormField
                      control={form.control}
                      name="installment_interest_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor do juros (%)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex.: 2.5"
                              type="number"
                              step="0.01"
                              min={0}
                              max={100}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="max_installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máximo de parcelas</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex.: 6"
                            type="number"
                            step="1"
                            min={1}
                            max={36}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Imagens do produto</FormLabel>
                      <FormControl>
                        <Input
                          {...fieldProps}
                          id="images"
                          type="file"
                          accept="image/*, application/pdf"
                          multiple
                          onChange={(event: any) => {
                            const files = event.target.files;
                            if (files && files.length > 0) {
                              const newPreviews = Array.from(files).map(
                                (file: any) => ({
                                  file,
                                  preview: URL.createObjectURL(
                                    new Blob([file], { type: file.type })
                                  ),
                                })
                              );
                              setFilePreviews([...filePreviews, ...newPreviews]);
                            }
                          }}
                        />
                      </FormControl>
                      <div className="flex flex-row items-center flex-wrap gap-6">
                        {filePreviews.map((preview, index) => (
                          <div key={index} className="relative mt-3 w-[100px]">
                            <div
                              className="absolute top-0 right-0 cursor-pointer"
                              onClick={() => handleDeleteFile(index)}
                            >
                              <TiDelete color="red" size={24} />
                            </div>
                            <div className="flex flex-col items-center">
                              {preview.file.type.startsWith("image") ? (
                                <Image
                                  className="w-[100px] h-[100px] border border-gray-200 rounded-md"
                                  src={preview.preview}
                                  alt={`Preview ${index + 1}`}
                                  width={100}
                                  height={100}
                                />
                              ) : (
                                <p className="text-xs">
                                  Arquivo: {preview.file.name}
                                </p>
                              )}
                              <div className="flex flex-col">
                                {index < filePreviews.length - 1 && (
                                  <LuMoveRight
                                    className="cursor-pointer"
                                    onClick={() => handleMoveDown(index)}
                                    size={24}
                                    color="#2c6e49"
                                  />
                                )}
                                {index > 0 && (
                                  <LuMoveLeft
                                    className="cursor-pointer"
                                    onClick={() => handleMoveUp(index)}
                                    size={24}
                                    color="#2c6e49"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {filePreviews.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              document.getElementById("images")?.click()
                            }
                            className="px-3 bg-green-primary rounded-md h-[40px]"
                          >
                            <IoMdAdd size={24} color="#fff" />
                          </button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel>Status</FormLabel>
                <div className="mt-3 space-y-3">
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              className="w-5 h-5"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span>Produto ativo</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              className="w-5 h-5"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span>Produto em destaque</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-10 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/product")}
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

export default ProductNewPage;
