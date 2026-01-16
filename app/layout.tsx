import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Bitrix24Provider } from "@/lib/bitrix/client-sdk";
import { Toaster } from '@/lib/toast';
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Beehouse - Autorização de Venda",
    description: "Sistema de geração de autorizações de venda integrado com Bitrix24",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={inter.className}>
                <Bitrix24Provider>
                    <Navbar />
                    {children}
                </Bitrix24Provider>
                <Toaster position="top-right" />
            </body>
        </html>
    );
}
