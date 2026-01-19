'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook para integração com Bitrix24
 * Detecta automaticamente o contexto do Bitrix24 e autentica o usuário
 */
export function useBitrix24Auth() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [bitrixUser, setBitrixUser] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Verificar se está rodando no contexto do Bitrix24
        if (typeof window === 'undefined' || !(window as any).BX24) {
            setError('Not running in Bitrix24 context');
            setIsLoading(false);
            return;
        }

        const BX24 = (window as any).BX24;

        // Inicializar Bitrix24 SDK
        try {
            // Tentar inicializar sem callback
            if (typeof BX24.init === 'function') {
                BX24.init();
            }

            console.log('[Bitrix24] SDK initialized');

            // Aguardar um momento para garantir inicialização
            setTimeout(() => {
                // Obter informações de autenticação
                if (typeof BX24.getAuth === 'function') {
                    BX24.getAuth((auth: any) => {
                        if (!auth || !auth.user_id) {
                            setError('No Bitrix24 user found');
                            setIsLoading(false);
                            return;
                        }

                        console.log('[Bitrix24] User authenticated:', auth.user_id);

                        // Obter informações adicionais do usuário
                        if (typeof BX24.callMethod === 'function') {
                            BX24.callMethod('user.current', {}, (result: any) => {
                                const userInfo = result.data();

                                // Autenticar no backend
                                authenticateWithBackend(auth, userInfo);
                            });
                        } else {
                            // Se não conseguir obter detalhes do usuário, usar apenas auth
                            authenticateWithBackend(auth, {});
                        }
                    });
                } else {
                    setError('BX24.getAuth not available');
                    setIsLoading(false);
                }
            }, 100);
        } catch (err: any) {
            console.error('[Bitrix24] Initialization error:', err);
            setError(err.message);
            setIsLoading(false);
        }
    }, []);

    const authenticateWithBackend = async (auth: any, userInfo: any) => {
        try {
            const response = await fetch('/api/auth/bitrix24', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: auth.user_id,
                    domain: auth.domain,
                    memberInfo: {
                        name: `${userInfo.NAME || ''} ${userInfo.LAST_NAME || ''}`.trim() || `User ${auth.user_id}`,
                        email: userInfo.EMAIL || `user${auth.user_id}@${auth.domain}`,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to authenticate with backend');
            }

            const data = await response.json();

            setBitrixUser(data.user);
            setIsAuthenticated(true);
            setIsLoading(false);

            console.log('[Bitrix24] Backend authentication successful');
        } catch (err: any) {
            console.error('[Bitrix24] Backend authentication error:', err);
            setError(err.message);
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        isAuthenticated,
        bitrixUser,
        error,
    };
}
