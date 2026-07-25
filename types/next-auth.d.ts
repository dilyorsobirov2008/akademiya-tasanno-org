import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "employee" | "admin";
      status: "pending" | "approved" | "rejected";
      branchId: string | null;
      branchName: string | null;
      positionId: string | null;
      positionName: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "employee" | "admin";
    status: "pending" | "approved" | "rejected";
    branchId: string | null;
    branchName: string | null;
    positionId: string | null;
    positionName: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "employee" | "admin";
    status: "pending" | "approved" | "rejected";
    branchId: string | null;
    branchName: string | null;
    positionId: string | null;
    positionName: string | null;
  }
}
