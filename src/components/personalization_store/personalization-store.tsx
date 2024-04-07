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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";

import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import { useCategoryService } from "@/services/category.service";

import useCategoryRegisterModal from "@/utils/hooks/category/useRegisterCategoryModal";
import { useRouter } from "next/navigation";

import { useUploadService } from "@/services/upload.service";

import Loader from "../loader";

import { useUserService } from "@/services/user.service";
import useShippingRegisterModal from "@/utils/hooks/shipping/useRegisterShippingModal";
import { SketchPicker } from "react-color";

interface ShippingRegisterProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  background_color: z.string(),
});

const PersonalizationStore = ({ isOpen, onClose }: ShippingRegisterProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const inputFileRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<any>(null);
  const [currentColor, setCurrentColor] = useState("#ff6");

  const categoryService = useCategoryService();
  const userService = useUserService();
  const uploadService = useUploadService();
  const categoryRegisterModal = useCategoryRegisterModal();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      background_color: "",
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
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    // useShippingRegisterModal.setState({ isRegister: false });
    // useCategoryUpdateModal.setState({ isUpdate: false });
    // useCategoryDeleteModal.setState({ isDelete: false });
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
