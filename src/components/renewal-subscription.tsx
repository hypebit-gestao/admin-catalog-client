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
import Stripe from "stripe";
import { useRouter } from "next/navigation";

// const stripe = new Stripe(
//   "sk_test_51OjRGjAmJVx5APmeCjrr8Iq1KOO2IQE18i0SyFa4vHuAUzAtQ7DXWUFX6yOqs407gBqe0rfCUmloRUdE5PCy54ez00gTWmaK0m"
// );
const stripe = new Stripe(
  "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"
);

interface RenewalSubscriptionProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  email: z.string().email("Email Inválido").min(1, "Email é obrigatório"),
});

const RenewalSubscription = ({ isOpen, onClose }: RenewalSubscriptionProps) => {
  const [loading, setLoading] = useState(false);
  const authService = useAuthService();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    const customer: any = await stripe.customers.list({
      email: data.email,
    });

    if (customer) {
      await stripe.checkout.sessions
        .create({
          payment_method_types: ["card"],
          line_items: [
            {
              // price: "price_1PCrSQAmJVx5APmeC7HTB76X",
              price: "price_1OlZ3PAmJVx5APmen55NHyH7",
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: "https://catalogoplaceadmin.vercel.app",
          client_reference_id: customer?.data[0]?.id,
          customer: customer?.data[0]?.id,
        })
        .then((res: any) => {
          setLoading(false);
          router.push(res?.url);
        })
        .catch(() => {
          setLoading(false);
        });
    }
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
              <h1 className="text-2xl font-bold">Renove sua assinatura</h1>
              <p>Digite seu e-mail para prosseguir para o pagamento</p>
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

export default RenewalSubscription;
