import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: {
    ...PrismaAdapter(prisma),
    createUser: async (data) => {
      const seed = data.email || Math.random().toString();
      const identiconUrl = `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(seed)}&rowColor=random`;
      return prisma.user.create({
        data: {
          ...data,
          image: identiconUrl,
        },
      }) as any;
    },
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
      allowDangerousEmailAccountLinking: true,
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
        (session.user as any).themeIndex = (user as any).themeIndex;
      }
      return session;
    },
  },

  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
};
