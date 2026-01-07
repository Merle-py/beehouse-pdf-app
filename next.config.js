/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        serverComponentsExternalPackages: ['pdfkit'],
    },
    // Suporte para rodar dentro do iframe do Bitrix24
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'ALLOWALL',
                    },
                ],
            },
        ];
    },
}

module.exports = nextConfig
