import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {

    // NÃO aplicar redirecionamento em rotas de API
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // 1. CORREÇÃO DO ERRO 405
    // O Bitrix carrega o iframe via POST, mas o Next.js só aceita GET em páginas.
    // Se for POST, forçamos um redirecionamento 303, que transforma a requisição em GET.
    if (request.method === 'POST') {
        const url = request.nextUrl.clone();

        // O status 303 (See Other) força o navegador a seguir o redirecionamento usando GET
        const response = NextResponse.redirect(url, 303);

        // Aplicamos os headers de segurança no redirecionamento também
        adicionarHeadersDeSeguranca(response);
        return response;
    }

    // 2. Requisições normais (GET)
    const response = NextResponse.next();
    adicionarHeadersDeSeguranca(response);
    return response;
}

// Função auxiliar para aplicar as permissões de Iframe (Tela Branca)
function adicionarHeadersDeSeguranca(response: NextResponse) {
    // Remove bloqueio antigo
    response.headers.delete('X-Frame-Options');

    // Permite o Bitrix carregar o site (CSP)
    response.headers.set(
        'Content-Security-Policy',
        "frame-ancestors * data: https: http:;"
    );

    // Permissões de origem (CORS)
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export const config = {
    matcher: '/:path*',
};
