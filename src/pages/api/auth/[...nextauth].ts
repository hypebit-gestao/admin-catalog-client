import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "password", type: "password" },
        impersonateToken: { label: "impersonateToken", type: "text" },
        impersonateUser: { label: "impersonateUser", type: "text" },
      },
      async authorize(credentials, req) {
        // Impersonation: token already issued by backend, use directly
        if (credentials?.impersonateToken) {
          return {
            accessToken: credentials.impersonateToken,
            user: JSON.parse(credentials.impersonateUser || "{}"),
          };
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          }
        );

        const data = await res.json();
        if (res.ok) {
          const user = {
            ...data,
          };
          return user;
        } else {
          throw new Error(data.message);
        }
      },
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 21600, // 6 hours
  },
  pages: {
    signIn: "/home",
    signOut: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, ...user };
    },
    async session({ session, token }) {
      session.user = token as any;
      return session;
    },
  },
};

export default NextAuth(authOptions);
