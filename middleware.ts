import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // NÃO aplicar redirecionamento em rotas de API
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return response;
    }

    // Páginas públicas que não precisam autenticação
    const publicPaths = ['/login', '/auth/callback'];
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

    // ⚠️ DESENVOLVIMENTO: Pular verificação de auth se DEV_BYPASS_AUTH está ativo
    const isDevBypass = process.env.DEV_BYPASS_AUTH === 'true';

    // Verificar autenticação (desenvolvimento usa bypass, produção usa session cookie)
    if (!isDevBypass && !isPublicPath) {
        // Verificar se tem cookie de sessão personalizado (Bitrix24 auth)
        const sessionCookie = request.cookies.get('beehouse_session');

        if (!sessionCookie) {
            // Sem sessão, redirecionar para login
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            // Validar sessão
            const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());

            // Verificar se sessão não expirou (7 dias)
            const sessionAge = Date.now() - sessionData.timestamp;
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

            if (sessionAge > maxAge) {
                // Sessão expirada
                return NextResponse.redirect(new URL('/login', request.url));
            }
        } catch (error) {
            // Sessão inválida
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 1. CORREÇÃO DO ERRO 405
    // O Bitrix carrega o iframe via POST, mas o Next.js só aceita GET em páginas.
    // Se for POST, forçamos um redirecionamento 303, que transforma a requisição em GET.
    if (request.method === 'POST') {
        const url = request.nextUrl.clone();

        // O status 303 (See Other) força o navegador a seguir o redirecionamento usando GET
        response = NextResponse.redirect(url, 303);

        // Aplicamos os headers de segurança no redirecionamento também
        adicionarHeadersDeSeguranca(response, request);
        return response;
    }

    // 2. Requisições normais (GET)
    adicionarHeadersDeSeguranca(response, request);
    return response;
}

// Função auxiliar para aplicar as permissões de Iframe (Tela Branca)
function adicionarHeadersDeSeguranca(response: NextResponse, request: NextRequest) {
    // Remove bloqueio antigo
    response.headers.delete('X-Frame-Options');

    // Permite o Bitrix carregar o site (CSP)
    response.headers.set(
        'Content-Security-Policy',
        "frame-ancestors * data: https: http:;"
    );

    // Permissões de origem (CORS) - Restrito a domínios Bitrix24
    const origin = request.headers.get('origin');
    const allowedOrigins = [
        /^https:\/\/.*\.bitrix24\.com$/,
        /^https:\/\/.*\.bitrix24\.com\.br$/,
        /^https:\/\/.*\.bitrix24\.net$/,
    ];

    // Verifica se a origem é permitida
    if (origin) {
        const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
        if (isAllowed) {
            response.headers.set('Access-Control-Allow-Origin', origin);
        }
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Bitrix-Token, X-Bitrix-Domain');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
}

export const config = {
    matcher: '/:path*',
};
