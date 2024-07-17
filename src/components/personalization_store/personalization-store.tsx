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

const PersonalizationStore = ({ isOpen, onClose }: ShippingRegisterProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User>()
  const [currentColor, setCurrentColor] = useState(user?.background_color ? user?.background_color : "#081c15");

  const userService = useUserService();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      background_color: "",
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
        setCustomValue("pix_discount", String(user.pix_discount));
        setCustomValue("credit_discount", String(user.credit_discount));
        setCustomValue("debit_discount", String(user.debit_discount));
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

              <div className="mt-12">
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
