"use client";

import React, { useState } from "react";
import Modal from "./modal";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "./ui/input";
import Loader from "./loader";
import toast from "react-hot-toast";
import { fetchWrapper } from "@/utils/functions/fetch";

interface RenewalSubscriptionProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
});

const RenewalSubscription = ({ isOpen, onClose }: RenewalSubscriptionProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await fetchWrapper<{ invoiceUrl: string }>("asaas/renewal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      if (result?.invoiceUrl) {
        window.open(result.invoiceUrl, "_blank");
        onClose();
      }
    } catch {
      toast.error("E-mail não encontrado ou fatura pendente não localizada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      personWidth="xl:w-[28%]"
      body={
        <div className="flex flex-col justify-center items-center">
          <div className="my-4 text-center">
            <h1 className="text-2xl font-bold">Renove sua assinatura</h1>
            <p className="text-sm text-gray-500 mt-1">
              Digite seu e-mail para acessar o portal de pagamento.
            </p>
          </div>
          <div className="w-full">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="mt-6">
                  <Button size="lg" className="w-full" type="submit" disabled={loading}>
                    {loading ? <Loader /> : "Acessar portal de pagamento"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      }
    />
  );
};

export default RenewalSubscription;
