"use client";

import React, { useEffect, useState } from "react";
import Modal from "../modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Loader from "../loader";
import { useUserService } from "@/services/user.service";
import { MdAnalytics, MdOpenInNew } from "react-icons/md";

interface GoogleAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  ga_measurement_id: z
    .string()
    .regex(/^(G-[A-Z0-9]+)?$/, {
      message: 'Formato inválido. Use o formato: G-XXXXXXXXXX',
    })
    .optional()
    .or(z.literal("")),
});

const GoogleAnalyticsModal = ({ isOpen, onClose }: GoogleAnalyticsModalProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const userService = useUserService();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { ga_measurement_id: "" },
  });

  useEffect(() => {
    if (!isOpen) return;
    const fetchUser = async () => {
      const user = await userService.GETBYID(
        session?.user?.user?.id,
        session?.user?.accessToken
      );
      if (user) {
        form.setValue("ga_measurement_id", user.ga_measurement_id ?? "");
      }
    };
    fetchUser();
  }, [isOpen]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    try {
      await userService.PUT(
        {
          id: session?.user?.user?.id,
          name: session?.user?.user?.name ?? "",
          ga_measurement_id: data.ga_measurement_id || null,
        } as any,
        session?.user?.accessToken
      );
      toast.success("Google Analytics configurado com sucesso!");
      onClose();
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-50 text-orange-500">
            <MdAnalytics size={24} />
          </div>
          <h1 className="text-[#2c6e49] font-bold text-xl">Google Analytics</h1>
        </div>
      }
      body={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">Como configurar:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Acesse o Google Analytics e crie uma propriedade</li>
                <li>Copie o <strong>Measurement ID</strong> (começa com <code>G-</code>)</li>
                <li>Cole no campo abaixo e salve</li>
              </ol>
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:underline font-medium"
              >
                Abrir Google Analytics <MdOpenInNew size={14} />
              </a>
            </div>

            <FormField
              control={form.control}
              name="ga_measurement_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Measurement ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="G-XXXXXXXXXX"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Deixe vazio para desativar o rastreamento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? <Loader /> : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      }
    />
  );
};

export default GoogleAnalyticsModal;
