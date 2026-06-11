import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ventas",
  description: "Sistema de Gestión de Ventas e Inventario",
};

export const dynamic = 'force-dynamic'; // Fuerza renderizado en servidor (Lee env en tiempo real)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Leemos las variables del contenedor Docker en tiempo real
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ENV = { SUPABASE_URL: "${supabaseUrl}", SUPABASE_ANON_KEY: "${supabaseAnonKey}" };`
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
