import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        (session.user as any).id = user.id;
        (session.user as any).username = (user as any).username;
        (session.user as any).isAdmin = (user as any).isAdmin;
        (session.user as any).battlesWon = (user as any).battlesWon;
        (session.user as any).battlesTotal = (user as any).battlesTotal;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
};
