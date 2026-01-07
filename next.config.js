/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        serverComponentsExternalPackages: ['pdfkit'],
    },
    // Permite que a aplicação seja exibida em iframes do Bitrix24
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    // NÃO define X-Frame-Options (permite todos os iframes)
                    // Usa Content-Security-Policy para controlar origens específicas
                    {
                        key: 'Content-Security-Policy',
                        value: "frame-ancestors 'self' https://*.bitrix24.com.br https://*.bitrix24.com https://*.bitrix24.net https://*.bitrix24.eu;",
                    },
                ],
            },
        ];
    },
}

module.exports = nextConfig
