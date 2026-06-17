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
import { FaInstagram } from "react-icons/fa";

interface SocialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  instagram_url: z.string().optional(),
});

const SocialModal = ({ isOpen, onClose }: SocialModalProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const userService = useUserService();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { instagram_url: "" },
  });

  useEffect(() => {
    if (!isOpen) return;
    const fetchUser = async () => {
      const user = await userService.GETBYID(
        session?.user?.user?.id,
        session?.user?.accessToken
      );
      if (user) {
        form.setValue("instagram_url", user.instagram_url ?? "");
      }
    };
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    try {
      await userService.PUT(
        {
          id: session?.user?.user?.id,
          name: session?.user?.user?.name ?? "",
          instagram_url: data.instagram_url || null,
        } as any,
        session?.user?.accessToken
      );
      toast.success("Redes sociais salvas!");
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
          <div className="p-2 rounded-lg bg-pink-50 text-pink-600">
            <FaInstagram size={22} />
          </div>
          <h1 className="text-[#2c6e49] font-bold text-xl">Redes Sociais</h1>
        </div>
      }
      body={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
            <FormField
              control={form.control}
              name="instagram_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FaInstagram size={14} className="text-pink-500" />
                    Instagram
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://instagram.com/sualoja"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Cole a URL completa do seu perfil. Deixe vazio para não exibir.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? <Loader /> : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      }
    />
  );
};

export default SocialModal;
