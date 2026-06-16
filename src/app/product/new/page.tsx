"use client";

import React, { useEffect, useState } from "react";
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
import { Input, InputCurrency } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useUploadService } from "@/services/upload.service";
import { useProductService } from "@/services/product.service";
import { useCategoryService } from "@/services/category.service";
import { Category } from "@/models/category";
import Select from "react-select";
import {
  Select as SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import Loader from "@/components/loader";
import { useSizeService } from "@/services/size.service";
import { Size } from "@/models/size";
import ContentMain from "@/components/content-main";
import { ImageDropzone, ImagePreviewItem } from "@/components/image-dropzone";
import { VideoDropzone, VideoPreviewItem } from "@/components/video-dropzone";
import { RichTextEditor } from "@/components/rich-text-editor";
import { useUnsavedChanges } from "@/utils/hooks/useUnsavedChanges";

const formSchema = z
  .object({
    name: z.string().min(1, "Nome do produto é obrigatório"),
    description: z.string().optional(),
    category_id: z.string().nullable(),
    size_ids: z.any(),
    featured: z.boolean(),
    active: z.boolean(),
    isPromotion: z.boolean(),
    promotion_price: z.string(),
    price: z.string(),
    installment_available: z.boolean(),
    installment_with_interest: z.boolean(),
    installment_interest_value: z.string().optional(),
    max_installments: z.string().optional(),
    unit: z.string().optional(),
    type: z.enum(["product", "service"]),
    price_on_request: z.boolean(),
  })
  .refine((data) => data.price_on_request || data.price.length > 0, {
    message: "Preço é obrigatório quando não for 'A consultar'",
    path: ["price"],
  })
  .refine(
    (data) => data.price_on_request || Number(data.promotion_price) <= Number(data.price),
    {
      message: "O preço promocional não pode ser maior que o preço normal",
      path: ["promotion_price"],
    }
  )
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const router = useRouter();
  const [previews, setPreviews] = useState<ImagePreviewItem[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<VideoPreviewItem[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      size_ids: [],
      featured: false,
      active: true,
      isPromotion: false,
      price: "",
      promotion_price: "",
      installment_available: false,
      installment_with_interest: false,
      installment_interest_value: "",
      max_installments: "1",
      unit: "",
      type: "product",
      price_on_request: false,
    },
  });

  const { setValue, watch } = form;
  const { confirmLeave } = useUnsavedChanges(form.formState.isDirty);

  const isPromotion = watch("isPromotion");
  const installmentAvailable = watch("installment_available");
  const installmentWithInterest = watch("installment_with_interest");
  const priceOnRequest = watch("price_on_request");

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    categoryService.GETALL(session.user.accessToken).then((res) => { if (res) setCategories(res); });
    sizeService.GETALL(session.user.accessToken).then((res) => { if (res) setSizes(res); });
  }, [session?.user?.accessToken]);

  const handleAddImages = (files: File[]) => {
    const newPreviews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleDeleteImage = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveLeft = (index: number) => {
    setPreviews((prev) => {
      const updated = [...prev];
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      return updated;
    });
  };

  const handleMoveRight = (index: number) => {
    setPreviews((prev) => {
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated;
    });
  };

  const handleAddVideos = (files: File[]) => {
    const newItems = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      orientation: 'horizontal' as const,
    }));
    setVideoPreviews((prev) => [...prev, ...newItems]);
  };

  const handleDeleteVideo = (index: number) => {
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeVideoOrientation = (index: number, orientation: 'horizontal' | 'vertical') => {
    setVideoPreviews((prev) =>
      prev.map((item, i) => (i === index ? { ...item, orientation } : item))
    );
  };

  const sizeOptions = sizes.map((s) => ({ value: s.id, label: s.size }));

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);

    const uploadedUrls: string[] = [];
    const uploadedVideoItems: { url: string; orientation: 'horizontal' | 'vertical' }[] = [];

    try {
      for (const item of previews) {
        if (typeof item !== "string" && item.file) {
          const res: any = await uploadService.POST({
            file: item.file,
            folderName: session?.user?.user?.name,
          });
          res?.forEach((r: any) => { if (r?.imageUrl) uploadedUrls.push(r.imageUrl); });
        }
      }

      for (const item of videoPreviews) {
        if ('file' in item && item.file) {
          const res: any = await uploadService.POST({
            file: item.file,
            folderName: session?.user?.user?.name,
          });
          res?.forEach((r: any) => {
            if (r?.imageUrl) uploadedVideoItems.push({ url: r.imageUrl, orientation: item.orientation });
          });
        }
      }

      await productService.POST(
        {
          name: data.name,
          category_id: data.category_id !== "" ? data.category_id : null,
          images: uploadedUrls.length > 0 ? uploadedUrls : null,
          currency: "brl",
          price: data.price_on_request ? 0 : Number(data.price),
          promotion_price: Number(data.promotion_price),
          user_id: session?.user?.user?.id,
          featured: data.featured,
          active: data.active,
          description: data.description ?? "",
          archived: false,
          installment_available: data.installment_available,
          installment_with_interest: data.installment_available ? data.installment_with_interest : false,
          installment_interest_value:
            data.installment_available && data.installment_with_interest
              ? Number(data.installment_interest_value)
              : null,
          max_installments: data.installment_available ? Number(data.max_installments ?? 1) : 1,
          unit: data.unit || null,
          variation_label: null,
          type: data.type,
          price_on_request: data.price_on_request,
          videos: uploadedVideoItems.length > 0 ? uploadedVideoItems : null,
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
            <div>
              <h2 className="my-4 font-semibold text-green-primary">Informações do produto</h2>

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-primary">Tipo</FormLabel>
                      <SelectComponent onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[300]">
                          <SelectItem value="product">Produto</SelectItem>
                          <SelectItem value="service">Serviço</SelectItem>
                        </SelectContent>
                      </SelectComponent>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <SelectComponent
                        onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                        defaultValue="null"
                      >
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[300]">
                          <SelectItem value="null">Sem categoria</SelectItem>
                          {categories.map((c, i) => (
                            <SelectItem key={i} value={c.id as string}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </SelectComponent>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="price_on_request"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Checkbox className="w-5 h-5" checked={field.value} onCheckedChange={field.onChange} />
                          <span className="font-medium">Preço a consultar</span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-400 mt-1">
                        Quando marcado, o catálogo exibirá &quot;A consultar&quot; no lugar do preço.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!priceOnRequest && (
                <>
                  <div className="mb-5">
                    <FormField
                      control={form.control}
                      name="isPromotion"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox className="w-5 h-5" checked={field.value} onCheckedChange={field.onChange} />
                              <span className="font-bold">Possui preço promocional?</span>
                            </label>
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
                              <InputCurrency placeholder="Preço do produto" type="number" {...field} />
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
                              <FormLabel className="text-blue-primary">Preço Promocional</FormLabel>
                              <FormControl>
                                <InputCurrency placeholder="Preço Promocional" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de venda</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                        >
                          <option value="">Por unidade (padrão)</option>
                          <option value="kg">Por kg — cliente digita a quantidade em gramas</option>
                          <option value="100g">Por 100g — cliente digita a quantidade em gramas</option>
                          <option value="L">Por litro — cliente digita a quantidade em ml</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Descrição do produto"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="mt-8">
              <h2 className="my-4 font-semibold text-green-primary">Informações adicionais</h2>

              <div className="mb-5 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                Variações (peso, sabor, tamanho, etc.) são gerenciadas na <strong>edição do produto</strong> após o cadastro.
              </div>

              <div className="mb-3"><h3 className="font-bold">Parcelamento</h3></div>
              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="installment_available"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Checkbox className="w-5 h-5" checked={field.value} onCheckedChange={field.onChange} />
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
                            <Checkbox className="w-5 h-5" checked={field.value} onCheckedChange={field.onChange} />
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
                            <Input placeholder="Ex.: 2.5" type="number" step="0.01" min={0} max={100} {...field} />
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
                          <Input placeholder="Ex.: 6" type="number" step="1" min={1} max={36} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="mb-5">
                <FormLabel>Imagens do {watch("type") === "service" ? "serviço" : "produto"}</FormLabel>
                <div className="mt-2">
                  <ImageDropzone
                    previews={previews}
                    onAdd={handleAddImages}
                    onDelete={handleDeleteImage}
                    onMoveLeft={handleMoveLeft}
                    onMoveRight={handleMoveRight}
                  />
                </div>
              </div>

              <div className="mb-5">
                <FormLabel>Vídeos</FormLabel>
                <p className="text-xs text-gray-400 mt-1 mb-2">
                  Adicione vídeos que serão exibidos na galeria do produto (MP4, MOV, WEBM).
                </p>
                <VideoDropzone
                  previews={videoPreviews}
                  onAdd={handleAddVideos}
                  onDelete={handleDeleteVideo}
                  onChangeOrientation={handleChangeVideoOrientation}
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
                            <Checkbox className="w-5 h-5" checked={field.value} onCheckedChange={field.onChange} />
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
                            <Checkbox className="w-5 h-5" checked={field.value} onCheckedChange={field.onChange} />
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

            <div className="mt-10 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => { if (confirmLeave()) router.push("/product"); }}
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
