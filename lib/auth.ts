import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Telefon", type: "text" },
        password: { label: "Parol", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Telefon va parol talab qilinadi");
        }

        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
          include: { branch: true, position: true },
        });

        if (!user) {
          throw new Error("Foydalanuvchi topilmadi");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Parol noto'g'ri");
        }

        return {
          id: user.id,
          name: user.fullName,
          role: user.role as "employee" | "admin",
          status: user.status as "pending" | "approved" | "rejected",
          branchId: user.branchId,
          branchName: user.branch?.name ?? null,
          positionId: user.positionId,
          positionName: user.position?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.branchId = user.branchId;
        token.branchName = user.branchName;
        token.positionId = user.positionId;
        token.positionName = user.positionName;
      }
      if (token?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: { branch: true, position: true },
        });
        if (dbUser) {
          token.status = dbUser.status as "pending" | "approved" | "rejected";
          token.role = dbUser.role as "employee" | "admin";
          token.branchId = dbUser.branchId;
          token.branchName = dbUser.branch?.name ?? null;
          token.positionId = dbUser.positionId;
          token.positionName = dbUser.position?.name ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.branchId = token.branchId;
        session.user.branchName = token.branchName;
        session.user.positionId = token.positionId;
        session.user.positionName = token.positionName;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
