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

import { Input, InputCurrency } from "@/components/ui/input";
import { Button } from "../ui/button";

import { useSession } from "next-auth/react";
import toast from "react-hot-toast";


import Loader from "../loader";

import { useUserService } from "@/services/user.service";
import { SketchPicker } from "react-color";
import { User } from "@/models/user";

interface ShippingRegisterProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  background_color: z.string(),
  pix_discount: z.string(),
  credit_discount: z.string(),
  debit_discount: z.string(),
});

const THEMES = [
  {
    id: "modern",
    label: "Moderno",
    desc: "Bordas arredondadas, sombras suaves",
    previewClass: "rounded-2xl shadow-md border border-gray-100 bg-white text-gray-700",
    pageBg: "#ffffff",
  },
  {
    id: "minimal",
    label: "Minimalista",
    desc: "Design limpo, sem sombras",
    previewClass: "rounded-none border-b-2 border-gray-400 shadow-none bg-white text-gray-700",
    pageBg: "#ffffff",
  },
  {
    id: "bold",
    label: "Arrojado",
    desc: "Bordas marcadas, alto contraste",
    previewClass: "rounded-xl border-2 border-gray-900 shadow-lg bg-white text-gray-900",
    pageBg: "#ffffff",
  },
  {
    id: "dark",
    label: "Escuro",
    desc: "Fundo escuro moderno e elegante",
    previewClass: "rounded-2xl border border-gray-600 shadow-none text-gray-200",
    pageBg: "#0d1117",
  },
  {
    id: "luxury",
    label: "Luxo",
    desc: "Ideal para perfumes e produtos premium",
    previewClass: "rounded-2xl border-2 text-yellow-300",
    pageBg: "#0e0900",
    borderColor: "#b45309",
  },
  {
    id: "rose",
    label: "Rosê",
    desc: "Ideal para moda, beleza e cosméticos",
    previewClass: "rounded-3xl border-2 border-rose-300 shadow-sm bg-rose-100 text-rose-700",
    pageBg: "#fff1f2",
  },
];

const PersonalizationStore = ({ isOpen, onClose }: ShippingRegisterProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User>()
  const [currentColor, setCurrentColor] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("modern");
  const [showStockQuantity, setShowStockQuantity] = useState(false);
  const [hideShareButtons, setHideShareButtons] = useState(false);
  const [hideOrderTracking, setHideOrderTracking] = useState(false);

  const userService = useUserService();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      background_color: user?.background_color || "",
      pix_discount: "",
      credit_discount: "",
      debit_discount: "",
    },
  });

  const handleOnChange = (color: any) => {
    setCurrentColor(color.hex);
  };


  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);

    await userService
      .PUT(
        {
          id: session?.user?.user?.id,
          background_color: currentColor,
          pix_discount: Number(data.pix_discount),
          credit_discount: Number(data.credit_discount),
          debit_discount: Number(data.debit_discount),
          theme: selectedTheme,
          show_stock_quantity: showStockQuantity,
          hide_share_buttons: hideShareButtons,
          hide_order_tracking: hideOrderTracking,
        },
        session?.user.accessToken
      )
      .then(() => {
        setLoading(false);
        onClose();
        toast.success("Tema da sua loja atualizado com sucesso!");
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
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

  const resetForm = () => {
    form.reset();
  };


  useEffect(() => {
    const getUser = async () => {
      const fetchedUser = await userService.GETBYID(
        session?.user?.user?.id,
        session?.user.accessToken
      );
      if (fetchedUser) {
        setUser(fetchedUser);
      }
    };

    getUser();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      if (user) {
        setCustomValue("background_color", user.background_color);
        setCurrentColor(user?.background_color || "");
        setCustomValue("pix_discount", String(user.pix_discount));
        setCustomValue("credit_discount", String(user.credit_discount));
        setCustomValue("debit_discount", String(user.debit_discount));
        setSelectedTheme(user.theme ?? "modern");
        setShowStockQuantity(user.show_stock_quantity ?? false);
        setHideShareButtons(user.hide_share_buttons ?? false);
        setHideOrderTracking(user.hide_order_tracking ?? false);
      }
    }
  }, [isOpen]);


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-[#2c6e49] font-bold text-xl">
            Personalização de sua loja
          </h1>
        </>
      }
      body={
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=" w-full">
              <div>
                <h1 className="my-4 font-semibold text-green-primary">
                  Informações Básicas
                </h1>
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="background_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tema de sua loja</FormLabel>
                        <SketchPicker
                          color={currentColor}
                          onChangeComplete={handleOnChange}
                        />

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Theme selector */}
                <div className="mt-6">
                  <h2 className="font-semibold text-green-primary mb-3">Tema da loja</h2>
                  <div className="grid grid-cols-1 gap-3">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTheme(t.id)}
                        className={`flex items-center gap-4 p-3 rounded-xl border-2 text-left transition-colors ${
                          selectedTheme === t.id
                            ? "border-green-primary bg-green-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`w-14 h-10 flex items-center justify-center text-[10px] font-bold shrink-0 ${t.previewClass}`}
                          style={{
                            backgroundColor: t.pageBg,
                            ...(t.borderColor ? { borderColor: t.borderColor } : {}),
                          }}
                        >
                          Abc
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                          <p className="text-xs text-gray-500">{t.desc}</p>
                        </div>
                        {selectedTheme === t.id && (
                          <span className="ml-auto text-green-primary text-lg">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-10">
                <h1 className="my-4 font-semibold text-green-primary">
                   Financeiro
                </h1>
                <div className="flex flex-col lg:flex-row">
                <div className="w-full lg:mr-5">
                    <FormField
                      control={form.control}
                      name="pix_discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Desconto no PIX (%)
                          </FormLabel>
                          <FormControl>
                            <InputCurrency
                            isPercentage
                              placeholder=""
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                <div className="w-full lg:mr-5">
                    <FormField
                      control={form.control}
                      name="credit_discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Desconto no CRÉDITO (%)
                          </FormLabel>
                          <FormControl>
                            <InputCurrency
                            isPercentage
                              placeholder=""
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
              
                </div>
                <div className="w-full mt-5">
                    <FormField
                      control={form.control}
                      name="debit_discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Desconto no DÉBITO (%)
                          </FormLabel>
                          <FormControl>
                            <InputCurrency
                            isPercentage
                              placeholder=""
                              type="number"
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

              <div className="mt-8">
                <h1 className="my-4 font-semibold text-green-primary">
                  Estoque
                </h1>
                <div
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer select-none"
                  onClick={() => setShowStockQuantity((v) => !v)}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Exibir quantidade em estoque</p>
                    <p className="text-xs text-gray-500 mt-0.5">Clientes verão a quantidade disponível nos cards e na página do produto</p>
                  </div>
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${showStockQuantity ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showStockQuantity ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer select-none"
                  onClick={() => setHideShareButtons((v) => !v)}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Ocultar botões de compartilhamento</p>
                    <p className="text-xs text-gray-500 mt-0.5">Remove os botões de compartilhar via WhatsApp, Facebook, X e copiar link da página do produto</p>
                  </div>
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${hideShareButtons ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${hideShareButtons ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 cursor-pointer select-none"
                  onClick={() => setHideOrderTracking((v) => !v)}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Ocultar link de rastreamento do pedido</p>
                    <p className="text-xs text-gray-500 mt-0.5">Remove o &ldquo;Acompanhe seu pedido&rdquo; da mensagem enviada ao WhatsApp (não se aplica a orçamentos)</p>
                  </div>
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${hideOrderTracking ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${hideOrderTracking ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  size="lg"
                  className={`w-full ${loading && "cursor-not-allowed"}`}
                  type="submit"
                >
                  {loading ? <Loader /> : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </>
      }
    />
  );
};

export default PersonalizationStore;
