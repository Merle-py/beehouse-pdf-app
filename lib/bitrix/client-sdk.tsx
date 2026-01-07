'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Bitrix24Context {
    isInitialized: boolean;
    isInsideBitrix: boolean;
    authId: string | null;
    domain: string | null;
}

const BitrixContext = createContext<Bitrix24Context>({
    isInitialized: false,
    isInsideBitrix: false,
    authId: null,
    domain: null
});

/**
 * Provider para contexto do Bitrix24
 */
export function Bitrix24Provider({ children }: { children: ReactNode }) {
    const [context, setContext] = useState<Bitrix24Context>({
        isInitialized: false,
        isInsideBitrix: false,
        authId: null,
        domain: null
    });

    useEffect(() => {
        // Detecta se está dentro do iframe do Bitrix24
        const isInIframe = window.self !== window.top;

        if (!isInIframe) {
            console.log('[Bitrix Client] Não está dentro do Bitrix24 (modo standalone)');
            setContext({
                isInitialized: true,
                isInsideBitrix: false,
                authId: null,
                domain: null
            });
            return;
        }

        // Carrega o SDK do Bitrix24
        const script = document.createElement('script');
        script.src = '//api.bitrix24.com/api/v1/';
        script.async = true;

        script.onload = () => {
            if (typeof window.BX24 !== 'undefined' && window.BX24) {
                window.BX24.init(() => {
                    const auth = window.BX24?.getAuth();
                    const domain = auth?.domain || null;
                    const authId = auth?.access_token || null;

                    console.log('[Bitrix Client] SDK inicializado:', { domain, hasAuth: !!authId });

                    setContext({
                        isInitialized: true,
                        isInsideBitrix: true,
                        authId,
                        domain
                    });
                });
            } else {
                console.error('[Bitrix Client] SDK não carregou corretamente');
                setContext({
                    isInitialized: true,
                    isInsideBitrix: false,
                    authId: null,
                    domain: null
                });
            }
        };

        script.onerror = () => {
            console.error('[Bitrix Client] Erro ao carregar SDK do Bitrix24');
            setContext({
                isInitialized: true,
                isInsideBitrix: false,
                authId: null,
                domain: null
            });
        };

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <BitrixContext.Provider value={context}>
            {children}
        </BitrixContext.Provider>
    );
}

/**
 * Hook para acessar o contexto do Bitrix24
 */
export function useBitrix24(): Bitrix24Context {
    return useContext(BitrixContext);
}

/**
 * Obtém o AUTH_ID do contexto do Bitrix24
 */
export function getAuthId(): string | null {
    if (typeof window !== 'undefined' && window.BX24) {
        const auth = window.BX24.getAuth();
        return auth?.access_token || null;
    }
    return null;
}

/**
 * Abre uma janela modal no Bitrix24
 */
export function openBitrixModal(url: string, width = 800, height = 600): void {
    if (typeof window !== 'undefined' && window.BX24) {
        window.BX24.openApplication({ bx24_width: width, bx24_height: height });
    }
}

/**
 * Fecha a aplicação no Bitrix24
 */
export function closeBitrixApp(): void {
    if (typeof window !== 'undefined' && window.BX24) {
        window.BX24.closeApplication();
    }
}

// Tipagem global do BX24
declare global {
    interface Window {
        BX24?: {
            init: (callback: () => void) => void;
            getAuth: () => { access_token: string; domain: string; expires_in: number };
            callMethod: (method: string, params: any, callback: (result: any) => void) => void;
            openApplication: (params: { bx24_width?: number; bx24_height?: number }) => void;
            closeApplication: () => void;
        };
    }
}
