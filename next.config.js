/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        serverComponentsExternalPackages: ['pdfkit'],
    },

    // Permite que o Bitrix carregue o site em um Iframe
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    // Esta linha é a mais importante:
                    { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://*.bitrix24.com https://*.bitrix24.com.br https://*.bitrix24.ru https://*.bitrix24.eu" },
                    { key: "X-Frame-Options", value: "ALLOWALL" }
                ],
            },
        ];
    },
};

module.exports = nextConfig;
