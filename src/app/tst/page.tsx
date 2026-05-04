"use client";

import { Input } from "@/components/ui/input";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  picture: z.any(),
});

const Home = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      picture: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const formData = new FormData();
      formData.append("file", values.picture); // Assuming you're allowing only one file
      formData.append("folderName", session?.user?.user?.name);
      // Send the formData to your server using fetch
      const response = await fetch("https://api-catalog-desenv.onrender.com/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Handle success
      } else {
        // Handle error
      }
    } catch (error) {}
  };

  const onLogout = () => {
    signOut({ redirect: false }).then(() => {
      toast.success("Deslogado com sucesso");
      router.push("/");
    });
  };

  return (
    <main className="min-h-screen flex justify-center items-center">
      <div>
        <Button onClick={onLogout}>Logout</Button>
      </div>
      <div className="bg-blue-600 w-1/2 rounded-lg p-6">
        <h1 className="text-center text-white">Upload de Imagem</h1>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="picture"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Picture</FormLabel>
                    <FormControl>
                      <Input
                        {...fieldProps}
                        placeholder="Picture"
                        type="file"
                        accept="image/*, application/pdf"
                        onChange={(event) => {
                          onChange(event.target.files && event.target.files[0]);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
};

export default Home;
