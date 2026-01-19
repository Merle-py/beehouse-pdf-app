'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [status, setStatus] = useState('Inicializando...');
    const [error, setError] = useState<string | null>(null);
    const [debugLog, setDebugLog] = useState<string[]>([]);

    const log = (msg: string) => {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        const logMsg = `[${timestamp}] ${msg}`;
        console.log(logMsg);
        setDebugLog(prev => [...prev, logMsg]);
    };

    useEffect(() => {
        let mounted = true;

        async function authenticateWithBitrix24() {
            try {
                log('Iniciando autenticação Bitrix24');

                // Aguardar BX24 carregar
                let attempts = 0;
                const checkInterval = setInterval(async () => {
                    attempts++;

                    const BX24 = (window as any).BX24;

                    if (BX24) {
                        clearInterval(checkInterval);
                        log('✅ BX24 detectado');

                        if (!mounted) return;

                        try {
                            // Método alternativo: usar BX24.callMethod para obter user.current
                            log('Tentando BX24.callMethod("user.current")...');

                            BX24.callMethod('user.current', {}, async (result: any) => {
                                try {
                                    log('✅ Callback de user.current executado');

                                    if (result.error()) {
                                        log(`❌ Erro do Bitrix24: ${JSON.stringify(result.error())}`);
                                        throw new Error(result.error().error_description || 'Erro ao obter dados do usuário');
                                    }

                                    const userData = result.data();
                                    log(`✅ Dados do usuário: ${JSON.stringify(userData)}`);

                                    if (!userData || !userData.ID) {
                                        throw new Error('ID do usuário não encontrado');
                                    }

                                    if (!mounted) return;

                                    const userId = userData.ID;
                                    log(`✅ User ID: ${userId}`);
                                    setStatus(`Autenticando usuário ${userId}...`);

                                    // Autenticar no backend
                                    const payload = {
                                        userId: userId.toString(),
                                        domain: 'viver.bitrix24.com.br',
                                        memberInfo: {
                                            name: `${userData.NAME || ''} ${userData.LAST_NAME || ''}`.trim() || `User ${userId}`,
                                            email: userData.EMAIL || `user${userId}@bitrix24.com`,
                                        },
                                    };

                                    log(`Enviando para API: ${JSON.stringify(payload)}`);

                                    const response = await fetch('/api/auth/bitrix24', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload),
                                    });

                                    log(`Response status: ${response.status}`);

                                    if (!response.ok) {
                                        const errorText = await response.text();
                                        log(`❌ API error: ${errorText}`);
                                        throw new Error(`API falhou: ${response.status}`);
                                    }

                                    const data = await response.json();
                                    log(`✅ Autenticação completa: ${JSON.stringify(data)}`);

                                    if (!mounted) return;

                                    setStatus('Sucesso! Redirecionando...');

                                    setTimeout(() => {
                                        log('Redirecionando para dashboard');
                                        router.push('/dashboard');
                                        router.refresh();
                                    }, 1000);
                                } catch (err: any) {
                                    if (!mounted) return;
                                    log(`❌ Erro no callback: ${err.message}`);
                                    setError(err.message);
                                }
                            });
                        } catch (err: any) {
                            log(`❌ Erro ao chamar BX24.callMethod: ${err.message}`);
                            setError(err.message);
                        }
                    } else if (attempts >= 100) {
                        clearInterval(checkInterval);
                        log('❌ Timeout: BX24 não carregou');
                        setError('SDK do Bitrix24 não carregou. Certifique-se de que está acessando via Bitrix24.');
                    }
                }, 100);
            } catch (err: any) {
                if (!mounted) return;
                log(`❌ ERRO: ${err.message}`);
                setError(err.message);
            }
        }

        authenticateWithBitrix24();

        return () => {
            mounted = false;
        };
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="card max-w-2xl w-full">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Beehouse</h1>
                    <p className="text-gray-600 text-sm">Sistema de Autorizações de Venda</p>
                </div>

                {error ? (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                        <div className="flex gap-3 mb-4">
                            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                                <p className="font-semibold text-red-900 mb-1">Erro de Autenticação</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>

                        <details open className="mt-4 pt-4 border-t border-red-200">
                            <summary className="cursor-pointer text-sm font-medium text-red-800 hover:text-red-900 mb-2">
                                🔍 Logs de debug ({debugLog.length} eventos)
                            </summary>
                            <div className="p-3 bg-white rounded max-h-60 overflow-y-auto">
                                {debugLog.map((log, i) => (
                                    <div key={i} className="text-xs font-mono text-gray-700 py-1 border-b border-gray-100 last:border-0">
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                ) : (
                    <div>
                        <div className="text-center mb-4">
                            <div className="flex justify-center mb-3">
                                <div className="spinner"></div>
                            </div>
                            <p className="text-gray-700 font-medium">{status}</p>
                        </div>

                        <details className="mt-4 pt-4 border-t border-gray-200">
                            <summary className="cursor-pointer text-sm text-center text-gray-500 hover:text-gray-700">
                                🔍 Logs ({debugLog.length})
                            </summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded max-h-60 overflow-y-auto">
                                {debugLog.map((log, i) => (
                                    <div key={i} className="text-xs font-mono text-gray-600 py-1 border-b border-gray-200 last:border-0">
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}
