'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [status, setStatus] = useState('Inicializando...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function authenticateBitrix24() {
            try {
                // Verificar se está no contexto do Bitrix24
                if (typeof window === 'undefined') {
                    setError('Window não disponível');
                    return;
                }

                const BX24 = (window as any).BX24;

                if (!BX24) {
                    setError('Este aplicativo deve ser executado dentro do Bitrix24');
                    return;
                }

                setStatus('Conectado ao Bitrix24. Autenticando...');

                // Inicializar SDK
                if (typeof BX24.init === 'function') {
                    BX24.init();
                }

                // Aguardar e obter autenticação
                setTimeout(async () => {
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
            } catch (err: any) {
                setError(`Erro: ${err.message}`);
            }
        }

        authenticateBitrix24();
    }, [router]);

    return (
        <html lang="pt-BR">
            <head>
                <title>Beehouse - Login</title>
                <script src="//api.bitrix24.com/api/v1/"></script>
            </head>
            <body style={{
                margin: 0,
                padding: '40px 20px',
                fontFamily: 'Arial, sans-serif',
                backgroundColor: '#f5f5f5',
                minHeight: '100vh',
            }}>
                <div style={{
                    maxWidth: '500px',
                    margin: '0 auto',
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
                    }}>
                        Beehouse
                    </h1>
                    <p style={{
                        textAlign: 'center',
                        color: '#666',
                        marginBottom: '30px',
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
                                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                                    <li>O aplicativo está sendo acessado via Bitrix24</li>
                                    <li>O SDK do Bitrix24 está carregado corretamente</li>
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
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '4px solid #f3f3f3',
                                    borderTop: '4px solid #3498db',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                }}>
                                </div>
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

                <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </body>
        </html>
    );
}
