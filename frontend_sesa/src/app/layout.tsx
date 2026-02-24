import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], preload: false });

export const metadata: Metadata = {
    title: "SysFarma | Gestão Pública",
    description: "Sistema para controle logístico da Assistência Farmacêutica",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen`}>
                {children}
            </body>
        </html>
    );
}
