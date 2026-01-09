/**
 * Utilitário para tratamento centralizado de erros
 */

export class AppError extends Error {
    constructor(
        message: string,
        public readonly code?: string,
        public readonly statusCode: number = 500,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'AppError';
    }

    toJSON() {
        return {
            success: false,
            error: this.message,
            code: this.code,
            details: this.details,
        };
    }
}

/**
 * Trata erros de forma consistente em toda a aplicação
 */
export function handleApiError(error: unknown): { message: string; code?: string; details?: any } {
    // Erro já é AppError
    if (error instanceof AppError) {
        return {
            message: error.message,
            code: error.code,
            details: error.details,
        };
    }

    // Erro padrão do JavaScript
    if (error instanceof Error) {
        return {
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        };
    }

    // Erro desconhecido
    return {
        message: 'Erro desconhecido',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    };
}

/**
 * Logger centralizado para erros
 */
export function logError(context: string, error: unknown) {
    const errorInfo = handleApiError(error);
    console.error(`[${context}] Erro:`, errorInfo.message);
    if (errorInfo.details) {
        console.error(`[${context}] Detalhes:`, errorInfo.details);
    }
}
