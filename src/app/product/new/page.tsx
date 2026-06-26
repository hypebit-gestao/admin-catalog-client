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
import { useProductVolumePriceService, VolumePrice } from "@/services/productVolumePrice.service";
import { TbTrash } from "react-icons/tb";
import { IoMdAdd } from "react-icons/io";

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
;

const ProductNewPage = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const productService = useProductService();
  const categoryService = useCategoryService();
  const uploadService = useUploadService();
  const sizeService = useSizeService();
  const volumePriceService = useProductVolumePriceService();
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const router = useRouter();
  const [previews, setPreviews] = useState<ImagePreviewItem[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<VideoPreviewItem[]>([]);
  const [hasVolumePrice, setHasVolumePrice] = useState(false);
  const [volumePrices, setVolumePrices] = useState<Omit<VolumePrice, "id" | "product_id">[]>([]);
  const [newVpMinQty, setNewVpMinQty] = useState("");
  const [newVpUnitPrice, setNewVpUnitPrice] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'absolute'>('percentage');
  const [discountMaxValue, setDiscountMaxValue] = useState("");
  const [stockEnabled, setStockEnabled] = useState(false);
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [outOfStockBehavior, setOutOfStockBehavior] = useState<'show_unavailable' | 'hide'>('show_unavailable');

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
      unit: "",
      type: "product",
      price_on_request: false,
    },
  });

  const { setValue, watch } = form;
  const { confirmLeave } = useUnsavedChanges(form.formState.isDirty);

  const isPromotion = watch("isPromotion");
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

  const handleAddVolumePrice = () => {
    const minQty = parseInt(newVpMinQty);
    const unitPrice = parseFloat(newVpUnitPrice);
    if (isNaN(minQty) || minQty < 1 || isNaN(unitPrice) || unitPrice < 0) return;
    if (volumePrices.some((vp) => vp.min_quantity === minQty)) {
      toast.error("Já existe uma faixa com essa quantidade mínima");
      return;
    }
    setVolumePrices((prev) =>
      [...prev, { min_quantity: minQty, unit_price: unitPrice }].sort(
        (a, b) => a.min_quantity - b.min_quantity
      )
    );
    setNewVpMinQty("");
    setNewVpUnitPrice("");
  };

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

      const created = await productService.POST(
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
          installment_available: false,
          installment_with_interest: false,
          installment_interest_value: null,
          max_installments: 1,
          unit: data.unit || null,
          variation_label: null,
          type: data.type,
          price_on_request: data.price_on_request,
          videos: uploadedVideoItems.length > 0 ? uploadedVideoItems : null,
          discount_enabled: discountEnabled,
          max_discount_type: discountEnabled ? discountType : 'percentage',
          max_discount_value: discountEnabled && discountMaxValue ? Number(discountMaxValue) : null,
          stock_enabled: stockEnabled,
          stock_quantity: stockEnabled && stockQuantity !== "" ? Number(stockQuantity) : null,
          out_of_stock_behavior: outOfStockBehavior,
        },
        session?.user?.accessToken
      );

      if (created?.id && hasVolumePrice && volumePrices.length > 0) {
        await Promise.all(
          volumePrices.map((vp) =>
            volumePriceService.POST(
              { product_id: created.id!, min_quantity: vp.min_quantity, unit_price: vp.unit_price },
              session?.user?.accessToken
            )
          )
        );
      }

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

              {!priceOnRequest && (
                <div className="mb-6">
                  <div className="mb-2">
                    <h3 className="font-bold">Desconto por quantidade</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Defina faixas de preço: a partir de X unidades o cliente paga R$ Y por unidade.
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        className="w-5 h-5"
                        checked={hasVolumePrice}
                        onCheckedChange={(v) => setHasVolumePrice(Boolean(v))}
                      />
                      <span className="font-medium text-sm">Ativar desconto progressivo</span>
                    </label>
                  </div>

                  {hasVolumePrice && (
                    <div className="border rounded-md p-3 bg-gray-50 flex flex-col gap-3">
                      {volumePrices.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-500 px-1">
                            <span>A partir de</span>
                            <span>Preço por unidade</span>
                            <span></span>
                          </div>
                          {volumePrices.map((vp, i) => (
                            <div key={i} className="grid grid-cols-3 gap-2 items-center border rounded bg-white px-2 py-2">
                              <span className="text-sm font-medium">{vp.min_quantity} unid.</span>
                              <span className="text-sm">
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(vp.unit_price)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setVolumePrices((prev) => prev.filter((_, idx) => idx !== i))}
                                className="justify-self-end text-red-400 hover:text-red-600"
                              >
                                <TbTrash className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1 border-t">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">A partir de (unidades)</label>
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            placeholder="Ex: 6"
                            value={newVpMinQty}
                            onChange={(e) => setNewVpMinQty(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">Preço por unidade (R$)</label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="Ex: 25.00"
                            value={newVpUnitPrice}
                            onChange={(e) => setNewVpUnitPrice(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="self-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddVolumePrice}
                            disabled={!newVpMinQty || !newVpUnitPrice}
                          >
                            <IoMdAdd className="w-4 h-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!priceOnRequest && (
                <div className="mb-6">
                  <div className="mb-2">
                    <h3 className="font-bold">Desconto negociável</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Permite que o vendedor ofereça desconto direto no card do produto, até o limite configurado.
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        className="w-5 h-5"
                        checked={discountEnabled}
                        onCheckedChange={(v) => setDiscountEnabled(Boolean(v))}
                      />
                      <span className="font-medium text-sm">Ativar desconto negociável</span>
                    </label>
                  </div>
                  {discountEnabled && (
                    <div className="border rounded-md p-3 bg-gray-50 flex flex-col gap-3">
                      <div className="flex gap-3 items-end">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Tipo de desconto</label>
                          <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'absolute')}
                            className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                          >
                            <option value="percentage">Porcentagem (%)</option>
                            <option value="absolute">Valor fixo (R$)</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">
                            Desconto máximo ({discountType === 'percentage' ? '%' : 'R$'})
                          </label>
                          <Input
                            type="number"
                            min={0}
                            step={discountType === 'percentage' ? 1 : 0.01}
                            max={discountType === 'percentage' ? 100 : undefined}
                            placeholder={discountType === 'percentage' ? "Ex: 15" : "Ex: 10.00"}
                            value={discountMaxValue}
                            onChange={(e) => setDiscountMaxValue(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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

              {/* Estoque */}
              <div className="mb-6">
                <h3 className="font-bold mb-1">Controle de estoque</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Quando ativado, o site exibe o produto como esgotado ou o oculta automaticamente.
                </p>
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <Checkbox
                    className="w-5 h-5"
                    checked={stockEnabled}
                    onCheckedChange={(v) => setStockEnabled(Boolean(v))}
                  />
                  <span className="font-medium text-sm">Controlar estoque deste produto</span>
                </label>

                {stockEnabled && (
                  <div className="border rounded-md p-4 bg-gray-50 flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        Quantidade em estoque
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStockQuantity((q) => String(Math.max(0, Number(q || 0) - 1)))}
                          className="w-8 h-8 rounded-md border border-gray-300 bg-white flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="0"
                          value={stockQuantity}
                          onChange={(e) => setStockQuantity(e.target.value)}
                          className="w-24 text-center text-base font-semibold border border-input rounded-md px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => setStockQuantity((q) => String(Number(q || 0) + 1))}
                          className="w-8 h-8 rounded-md border border-gray-300 bg-white flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                        {Number(stockQuantity) === 0 && stockQuantity !== "" && (
                          <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                            Esgotado
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-2 block">
                        Quando o estoque chegar a zero:
                      </label>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-start gap-2 cursor-pointer p-2.5 rounded-lg border border-transparent hover:bg-white hover:border-gray-200 transition-colors">
                          <input
                            type="radio"
                            name="out_of_stock_behavior_new"
                            value="show_unavailable"
                            checked={outOfStockBehavior === 'show_unavailable'}
                            onChange={() => setOutOfStockBehavior('show_unavailable')}
                            className="mt-0.5 accent-green-600"
                          />
                          <div>
                            <p className="text-sm font-medium">Exibir como esgotado</p>
                            <p className="text-xs text-gray-400">O produto continua visível com badge "Esgotado" e botão desabilitado.</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer p-2.5 rounded-lg border border-transparent hover:bg-white hover:border-gray-200 transition-colors">
                          <input
                            type="radio"
                            name="out_of_stock_behavior_new"
                            value="hide"
                            checked={outOfStockBehavior === 'hide'}
                            onChange={() => setOutOfStockBehavior('hide')}
                            className="mt-0.5 accent-green-600"
                          />
                          <div>
                            <p className="text-sm font-medium">Ocultar do catálogo</p>
                            <p className="text-xs text-gray-400">O produto some automaticamente quando o estoque zerar.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
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
