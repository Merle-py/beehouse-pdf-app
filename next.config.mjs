/** @type {import('next').NextConfig} */
const nextConfig = {
    // Otimizações de performance
    experimental: {
        // Otimizar bundle
        optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
    },

    // Desabilitar x-powered-by header
    poweredByHeader: false,

    // Comprimir responses
    compress: true,

    // Configurações de imagem (se usar Next/Image no futuro)
    images: {
        domains: ['cdn.bitrix24.com.br'],
        formats: ['image/avif', 'image/webp'],
    },

    // Headers de cache e segurança
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'private, max-age=60, stale-while-revalidate=120',
                    },
                ],
            },
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
