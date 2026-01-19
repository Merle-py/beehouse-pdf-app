// Tipos globais para Bitrix24 SDK
declare global {
    interface Window {
        BX24?: any; // Simplified - Bitrix24 SDK has varying signatures
    }
}

export interface BitrixAuth {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    domain?: string;
    member_id?: string;
    user_id?: string;
}

export interface BitrixResult {
    data: () => any;
    error?: () => any;
    more?: () => boolean;
}

export { };
