import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ichki Akademiya",
  description: "Xodimlar uchun o'quv portali va boshqaruv paneli",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
