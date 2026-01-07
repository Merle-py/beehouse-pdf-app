import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Cria resposta com headers customizados para permitir iframe do Bitrix24
    const response = NextResponse.next();

    // Remove X-Frame-Options se existir
    response.headers.delete('X-Frame-Options');

    // Adiciona headers para permitir Bitrix24
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set(
        'Content-Security-Policy',
        "frame-ancestors 'self' https://*.bitrix24.com https://*.bitrix24.com.br https://*.bitrix24.ru https://*.bitrix24.eu"
    );

    return response;
}

// Aplica o middleware em todas as rotas
export const config = {
    matcher: '/:path*',
};
