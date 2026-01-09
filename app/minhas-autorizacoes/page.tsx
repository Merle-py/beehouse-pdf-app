'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import Link from 'next/link';

interface Authorization {
    ID: string;
    TITLE: string;
    DATE_CREATE: string;
    COMMENTS: string;
}

export default function MyAuthorizationsPage() {
    const router = useRouter();
    const bitrix = useBitrix24();
    const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (bitrix.isInitialized && bitrix.authId) {
            loadAuthorizations();
        } else if (bitrix.isInitialized && !bitrix.authId) {
            setError('Você precisa estar logado no Bitrix24 para ver suas autorizações');
            setLoading(false);
        }
    }, [bitrix.isInitialized, bitrix.authId]);

    const loadAuthorizations = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/bitrix/my-authorizations?brokerId=${bitrix.authId}`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Erro ao carregar autorizações');
            }

            setAuthorizations(data.companies || []);
        } catch (err: any) {
            console.error('[My Authorizations] Erro:', err);
            setError(err.message || 'Erro ao carregar autorizações');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-beehouse-secondary mb-2">
                            Minhas Autorizações
                        </h1>
                        <p className="text-gray-600">
                            Visualize todas as autorizações de venda que você criou
                        </p>
                    </div>

                    <Link
                        href="/nova-autorizacao"
                        className="btn-secondary"
                    >
                        ← Nova Autorização
                    </Link>
                </div>

                {/* Status do Bitrix24 */}
                {bitrix.isInitialized && (
                    <div className="mb-6">
                        {bitrix.isInsideBitrix ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-800">
                                    ✓ Conectado ao Bitrix24 - <strong>{bitrix.domain}</strong>
                                </p>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-yellow-800">
                                    ⚠️ Modo standalone - Para ver suas autorizações, acesse via Bitrix24
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="card text-center py-12">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando autorizações...</p>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-800 text-lg mb-2">❌ {error}</p>
                        <button
                            onClick={loadAuthorizations}
                            className="btn-primary mt-4"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                )}

                {/* Lista de Autorizações */}
                {!loading && !error && (
                    <>
                        {authorizations.length === 0 ? (
                            <div className="card text-center py-12">
                                <p className="text-gray-600 text-lg mb-4">
                                    Você ainda não criou nenhuma autorização
                                </p>
                                <Link href="/nova-autorizacao" className="btn-primary inline-block">
                                    Criar Primeira Autorização
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 text-gray-600">
                                    Total: <strong>{authorizations.length}</strong> autorização(ões)
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {authorizations.map((auth) => (
                                        <div key={auth.ID} className="card hover:shadow-lg transition-shadow">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {auth.TITLE}
                                                </h3>
                                                <span className="bg-beehouse-primary text-white text-xs px-2 py-1 rounded">
                                                    ID: {auth.ID}
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-sm text-gray-600">
                                                <div>
                                                    <strong>Data:</strong> {formatDate(auth.DATE_CREATE)}
                                                </div>

                                                {auth.COMMENTS && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <p className="text-xs text-gray-500 whitespace-pre-line">
                                                            {auth.COMMENTS.split('\n').slice(0, 2).join('\n')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                                                <button
                                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded transition-colors text-sm"
                                                    onClick={() => router.push(`/editar-empresa/${auth.ID}`)}
                                                >
                                                    📝 Editar
                                                </button>
                                                <button
                                                    className="flex-1 bg-beehouse-primary hover:bg-beehouse-accent text-white py-2 px-4 rounded transition-colors text-sm"
                                                    onClick={() => router.push(`/autorizacao/${auth.ID}`)}
                                                >
                                                    👁️ Ver Detalhes
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
