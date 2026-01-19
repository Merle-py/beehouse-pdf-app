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
        let timeoutId: NodeJS.Timeout;

        async function authenticateWithBitrix24() {
            try {
                log('Iniciando processo de autenticação');
                setStatus('Verificando SDK do Bitrix24...');

                // Timeout de segurança - 15 segundos
                timeoutId = setTimeout(() => {
                    if (mounted && !error) {
                        log('TIMEOUT: 15 segundos sem resposta');
                        setError('Timeout: A autenticação demorou muito. Verifique se está acessando via Bitrix24.');
                    }
                }, 15000);

                // Verificar se BX24 existe
                if (typeof window === 'undefined') {
                    throw new Error('Window não disponível');
                }

                log('Window disponível, verificando BX24...');

                // Aguardar BX24 carregar
                let attempts = 0;
                const maxAttempts = 100; // 10 segundos

                const checkInterval = setInterval(() => {
                    attempts++;
                    log(`Tentativa ${attempts}/${maxAttempts} de detectar BX24`);

                    const BX24 = (window as any).BX24;

                    if (BX24) {
                        clearInterval(checkInterval);
                        log('✅ BX24 detectado!');

                        if (!mounted) {
                            log('Componente desmontado, abortando');
                            return;
                        }

                        setStatus('SDK carregado. Inicializando...');

                        try {
                            log('Chamando BX24.init()...');
                            if (typeof BX24.init === 'function') {
                                BX24.init();
                                log('✅ BX24.init() executado');
                            } else {
                                log('⚠️ BX24.init não é uma função');
                            }

                            setTimeout(() => {
                                if (!mounted) return;

                                log('Chamando BX24.getAuth()...');
                                setStatus('Obtendo dados de autenticação...');

                                if (typeof BX24.getAuth !== 'function') {
                                    throw new Error('BX24.getAuth não é uma função');
                                }

                                BX24.getAuth((auth: any) => {
                                    log(`✅ BX24.getAuth callback executado`);
                                    log(`Auth data: ${JSON.stringify(auth)}`);

                                    if (!mounted) {
                                        log('Componente desmontado após getAuth');
                                        return;
                                    }

                                    if (!auth) {
                                        log('❌ Auth é null/undefined');
                                        throw new Error('Dados de autenticação vazios');
                                    }

                                    if (!auth.user_id) {
                                        log('❌ user_id não encontrado');
                                        throw new Error('user_id não encontrado no Bitrix24');
                                    }

                                    log(`✅ User ID: ${auth.user_id}`);
                                    setStatus(`Autenticando usuário ${auth.user_id}...`);

                                    // Autenticar no backend
                                    authenticateBackend(auth);
                                });
                            }, 500);
                        } catch (err: any) {
                            log(`❌ Erro ao inicializar BX24: ${err.message}`);
                            throw err;
                        }
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        log('❌ BX24 não detectado após todas as tentativas');
                        throw new Error('SDK do Bitrix24 não carregou. Certifique-se de que está abrindo o app via Bitrix24.');
                    }
                }, 100);
            } catch (err: any) {
                if (!mounted) return;
                log(`❌ ERRO FATAL: ${err.message}`);
                setError(err.message);
                clearTimeout(timeoutId);
            }
        }

        async function authenticateBackend(auth: any) {
            try {
                log('Enviando dados para /api/auth/bitrix24...');

                const payload = {
                    userId: auth.user_id,
                    domain: auth.domain || 'viver.bitrix24.com.br',
                    memberInfo: {
                        name: `User ${auth.user_id}`,
                        email: `user${auth.user_id}@${auth.domain || 'bitrix24.com'}`,
                    },
                };

                log(`Payload: ${JSON.stringify(payload)}`);

                const response = await fetch('/api/auth/bitrix24', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                log(`Response status: ${response.status}`);

                if (!response.ok) {
                    const errorText = await response.text();
                    log(`❌ Response error: ${errorText}`);
                    throw new Error(`Falha na API: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                log(`✅ Response data: ${JSON.stringify(data)}`);

                if (!mounted) return;

                log('✅ Autenticação completa! Redirecionando...');
                setStatus('Sucesso! Redirecionando para dashboard...');

                setTimeout(() => {
                    router.push('/dashboard');
                    router.refresh();
                }, 1000);
            } catch (err: any) {
                if (!mounted) return;
                log(`❌ Erro no backend: ${err.message}`);
                setError(`Erro ao autenticar no servidor: ${err.message}`);
            }
        }

        authenticateWithBitrix24();

        return () => {
            mounted = false;
            if (timeoutId) clearTimeout(timeoutId);
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

                        <details className="mt-4 pt-4 border-t border-red-200">
                            <summary className="cursor-pointer text-sm font-medium text-red-800 hover:text-red-900">
                                🔍 Ver logs de debug ({debugLog.length} eventos)
                            </summary>
                            <div className="mt-2 p-3 bg-white rounded max-h-60 overflow-y-auto">
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
                                🔍 Logs de debug ({debugLog.length} eventos)
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
