'use client';

import { useBitrix24Auth } from '@/lib/hooks/useBitrix24Auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Página de login automático via Bitrix24
 * Detecta o usuário logado no Bitrix24 e autentica automaticamente
 */
export default function LoginPage() {
    const router = useRouter();
    const { isLoading, isAuthenticated, bitrixUser, error } = useBitrix24Auth();

    useEffect(() => {
        // Redirecionar para dashboard se autenticado
        if (isAuthenticated && bitrixUser) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, bitrixUser, router]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
                <div className="card max-w-md w-full shadow-xl">
                    <div className="text-center">
                        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Erro de Autenticação
                        </h1>
                        <p className="text-gray-600 mb-4">
                            {error}
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm">
                            <p className="font-medium mb-1">Nota:</p>
                            <p>Este aplicativo deve ser executado dentro do Bitrix24.</p>
                            <p>Por favor, acesse através do menu de aplicativos do Bitrix24.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="card max-w-md w-full shadow-xl">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Beehouse
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Sistema de Autorizações de Venda
                    </p>

                    <div className="space-y-2 text-sm text-gray-500">
                        <p>🔄 Conectando com Bitrix24...</p>
                        <p>🔐 Autenticando usuário...</p>
                    </div>

                    {bitrixUser && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                            ✅ Usuário autenticado: <strong>{bitrixUser.name}</strong>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
