// Re-exporta react-hot-toast com configuração padrão
export { toast, Toaster } from 'react-hot-toast';

// Configuração padrão para o projeto
export const toastConfig = {
    duration: 4000,
    position: 'top-right' as const,
    style: {
        background: '#333',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
    },
    success: {
        iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
        },
    },
    error: {
        iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
        },
    },
};
