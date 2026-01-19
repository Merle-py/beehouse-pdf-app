'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function LoginPage() {
    const router = useRouter();
    const [status, setStatus] = useState('Inicializando...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function authenticateBitrix24() {
            try {
                setStatus('Aguardando SDK do Bitrix24...');

                // Aguardar SDK carregar
                const checkBX24 = setInterval(() => {
                    const BX24 = (window as any).BX24;

                    if (BX24) {
                        clearInterval(checkBX24);

                        setStatus('Conectado ao Bitrix24. Autenticando...');

                        // Inicializar SDK
                        if (typeof BX24.init === 'function') {
                            BX24.init();
                        }

                        // Obter autenticação
                        setTimeout(() => {
                            if (typeof BX24.getAuth === 'function') {
                                BX24.getAuth(async (auth: any) => {
                                    if (!auth || !auth.user_id) {
                                        setError('Usuário não encontrado no Bitrix24');
                                        return;
                                    }

                                    setStatus(`Usuário ${auth.user_id} detectado. Criando sessão...`);

                                    // Autenticar no backend
                                    try {
                                        const response = await fetch('/api/auth/bitrix24', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                userId: auth.user_id,
                                                domain: auth.domain || 'viver.bitrix24.com.br',
                                                memberInfo: {
                                                    name: `User ${auth.user_id}`,
                                                    email: `user${auth.user_id}@bitrix24.com`,
                                                },
                                            }),
                                        });

                                        if (!response.ok) {
                                            throw new Error('Falha ao autenticar no backend');
                                        }

                                        setStatus('Autenticado! Redirecionando...');

                                        // Redirecionar para dashboard
                                        setTimeout(() => {
                                            router.push('/dashboard');
                                            router.refresh();
                                        }, 500);
                                    } catch (err: any) {
                                        setError(`Erro no backend: ${err.message}`);
                                    }
                                });
                            } else {
                                setError('BX24.getAuth não disponível');
                            }
                        }, 200);
                    }
                }, 100);

                // Timeout após 10 segundos
                setTimeout(() => {
                    clearInterval(checkBX24);
                    if (!error && status === 'Aguardando SDK do Bitrix24...') {
                        setError('Timeout: SDK do Bitrix24 não carregou. Certifique-se de que está acessando via Bitrix24.');
                    }
                }, 10000);
            } catch (err: any) {
                setError(`Erro: ${err.message}`);
            }
        }

        authenticateBitrix24();
    }, [router]);

    return (
        <>
            <Script
                src="//api.bitrix24.com/api/v1/"
                strategy="beforeInteractive"
            />

            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                padding: '20px',
            }}>
                <div style={{
                    maxWidth: '500px',
                    width: '100%',
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                }}>
                    <h1 style={{
                        fontSize: '28px',
                        marginBottom: '10px',
                        color: '#333',
                        textAlign: 'center',
                        fontWeight: 'bold',
                    }}>
                        Beehouse
                    </h1>
                    <p style={{
                        textAlign: 'center',
                        color: '#666',
                        marginBottom: '30px',
                        fontSize: '14px',
                    }}>
                        Sistema de Autorizações de Venda
                    </p>

                    {error ? (
                        <div style={{
                            padding: '15px',
                            backgroundColor: '#fee',
                            border: '1px solid #fcc',
                            borderRadius: '4px',
                            color: '#c33',
                            marginBottom: '20px',
                        }}>
                            <strong>Erro:</strong> {error}
                            <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                                <strong>Certifique-se de que:</strong>
                                <ul style={{ marginTop: '10px', paddingLeft: '20px', lineHeight: '1.6' }}>
                                    <li>O aplicativo está sendo acessado via Bitrix24</li>
                                    <li>O SDK do Bitrix24 está carregado corretamente</li>
                                    <li>Você tem permissão para acessar o aplicativo</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '20px',
                            }}>
                                <div className="spinner"></div>
                            </div>
                            <p style={{
                                textAlign: 'center',
                                color: '#666',
                                fontSize: '14px',
                            }}>
                                {status}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
