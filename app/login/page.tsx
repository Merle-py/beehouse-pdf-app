'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [status, setStatus] = useState('Inicializando...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function authenticateBitrix24() {
            try {
                setStatus('Aguardando SDK do Bitrix24...');

                // Aguardar SDK carregar com timeout
                let attempts = 0;
                const maxAttempts = 50; // 5 segundos

                const checkBX24 = setInterval(() => {
                    attempts++;
                    const BX24 = (window as any).BX24;

                    if (BX24 && typeof BX24.init === 'function') {
                        clearInterval(checkBX24);

                        if (!mounted) return;

                        setStatus('SDK carregado. Autenticando...');

                        // Inicializar SDK
                        BX24.init();

                        // Obter autenticação após pequeno delay
                        setTimeout(() => {
                            if (!mounted) return;

                            if (typeof BX24.getAuth === 'function') {
                                BX24.getAuth(async (auth: any) => {
                                    if (!mounted) return;

                                    if (!auth || !auth.user_id) {
                                        setError('Usuário não encontrado no Bitrix24');
                                        return;
                                    }

                                    setStatus(`Autenticando usuário ${auth.user_id}...`);

                                    try {
                                        const response = await fetch('/api/auth/bitrix24', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                userId: auth.user_id,
                                                domain: auth.domain || 'viver.bitrix24.com.br',
                                                memberInfo: {
                                                    name: `User ${auth.user_id}`,
                                                    domain: auth.domain,
                                                },
                                            }),
                                        });

                                        if (!response.ok) {
                                            const errorData = await response.json();
                                            throw new Error(errorData.error || 'Falha ao autenticar');
                                        }

                                        if (!mounted) return;
                                        setStatus('Sucesso! Redirecionando...');

                                        setTimeout(() => {
                                            router.push('/dashboard');
                                            router.refresh();
                                        }, 500);
                                    } catch (err: any) {
                                        if (!mounted) return;
                                        setError(`Erro de autenticação: ${err.message}`);
                                    }
                                });
                            } else {
                                if (!mounted) return;
                                setError('BX24.getAuth não disponível');
                            }
                        }, 300);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkBX24);
                        if (!mounted) return;
                        setError('Timeout: SDK do Bitrix24 não carregou. Certifique-se de que está acessando via Bitrix24.');
                    }
                }, 100);
            } catch (err: any) {
                if (!mounted) return;
                setError(`Erro: ${err.message}`);
            }
        }

        authenticateBitrix24();

        return () => {
            mounted = false;
        };
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="card max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Beehouse
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Sistema de Autorizações de Venda
                    </p>
                </div>

                {error ? (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-semibold text-red-900 mb-1">Erro de Autenticação</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-red-200">
                            <p className="text-sm text-red-800 font-medium mb-2">Certifique-se de que:</p>
                            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                                <li>O aplicativo está sendo acessado via Bitrix24</li>
                                <li>O SDK do Bitrix24 está habilitado</li>
                                <li>Você tem permissão para usar este aplicativo</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="spinner"></div>
                        </div>
                        <p className="text-gray-600 text-sm">{status}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
