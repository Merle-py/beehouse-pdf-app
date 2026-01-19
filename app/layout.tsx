import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Beehouse - Autorizações de Venda',
    description: 'Sistema de Gerenciamento de Autorizações de Venda',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <head>
                {/* Bitrix24 SDK */}
                <Script
                    src="//api.bitrix24.com/api/v1/"
                    strategy="beforeInteractive"
                />
            </head>
            <body className={inter.className}>
                <Navbar />
                <main className="min-h-screen bg-gray-50">
                    {children}
                </main>
                <Toaster position="top-right" />
            </body>
        </html>
    );
}
