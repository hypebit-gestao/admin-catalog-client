import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      accessToken: string;
      user: {
        id: string | undefined;
        name: any;
        email: string;
        image_url: string;
        createdAt: Date;
        updatedAt: Date;
        cpf: string;
        password: string;
        last_name: string;
        user_type: number;
      };
    };
  }
}
