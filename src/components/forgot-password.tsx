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
import { useAuthService } from "@/services/auth.service";
import Loader from "./loader";
import toast from "react-hot-toast";

interface ForgotPasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  email: z.string().email("Email Inválido").min(1, "Email é obrigatório"),
});

const ForgotPassword = ({ isOpen, onClose }: ForgotPasswordProps) => {
  const [loading, setLoading] = useState(false);
  const authService = useAuthService();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log("Data: ", data.email);
    if (loading) return;
    setLoading(true);
    await authService
      .FORGOTPASSWORD(data.email)
      .then((res) => {
        setLoading(false);
        toast.success(res.message);
        onClose();
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.message);
      });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      personWidth="xl:w-[28%]  "
      body={
        <>
          <div className="flex flex-col justify-center items-center xl:text-xl">
            <div className="my-4 ">
              <h1 className="text-2xl font-bold">Esqueceu sua Senha?</h1>
              <p>
                Digite seu e-mail para receber um link para redefinir sua senha
              </p>
            </div>
            <div className="w-full">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                  <div>
                    <div className="w-full">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              E-mail
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Insira seu e-mail"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <Button size="lg" className="w-full" type="submit">
                      {loading ? <Loader /> : "Enviar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </>
      }
    />
  );
};

export default ForgotPassword;
