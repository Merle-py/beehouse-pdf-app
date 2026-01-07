'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import Link from 'next/link';

interface AuthorizationDetail {
    success: boolean;
    isOwner: boolean;
    isAdmin: boolean;
    company: any;
    properties: any[];
    canEdit: boolean;
    canDelete: boolean;
    message?: string;
}

export default function AutorizacaoDetalhesPage() {
    const params = useParams();
    const bitrix = useBitrix24();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AuthorizationDetail | null>(null);

    const companyId = params.companyId as string;

    useEffect(() => {
        if (bitrix.isInitialized) {
            loadAuthorization();
        }
    }, [bitrix.isInitialized, companyId]);

    const loadAuthorization = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/bitrix/authorization/${companyId}?brokerId=${bitrix.authId}`);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Erro ao carregar autorização');
            }

            setData(result);
        } catch (err: any) {
            console.error('[Detalhes] Erro:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="card">
                        <p className="text-red-600 mb-4">❌ {error || 'Erro desconhecido'}</p>
                        <Link href="/dashboard" className="btn-primary">
                            ← Voltar ao Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Link href="/dashboard" className="text-beehouse-primary hover:underline">
                        ← Voltar ao Dashboard
                    </Link>
                </div>

                {/* Header */}
                <div className="card mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{data.company.TITLE}</h1>
                            <p className="text-gray-600">Company ID: {data.company.ID}</p>

                            {data.isOwner && (
                                <span className="inline-block mt-2 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                                    ✓ Você criou esta autorização
                                </span>
                            )}
                        </div>

                        {data.canEdit && (
                            <button
                                className="btn-primary"
                                onClick={() => alert('Função de edição em desenvolvimento')}
                            >
                                ✏️ Editar
                            </button>
                        )}
                    </div>
                </div>

                {/* Conteúdo baseado em permissão */}
                {data.isOwner || data.isAdmin ? (
                    <>
                        {/* Dados Completos da Company */}
                        <div className="card mb-6">
                            <h2 className="text-2xl font-bold mb-4">Informações da Empresa</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(data.company).map(([key, value]) => {
                                    if (key === 'ID' || !value) return null;
                                    return (
                                        <div key={key} className="border-b pb-2">
                                            <span className="text-sm text-gray-600 font-semibold">{key}:</span>
                                            <p className="text-gray-800">{String(value)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Imóveis Vinculados */}
                        <div className="card">
                            <h2 className="text-2xl font-bold mb-4">
                                Imóveis Vinculados ({data.properties.length})
                            </h2>

                            {data.properties.length === 0 ? (
                                <p className="text-gray-600">Nenhum imóvel vinculado</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.properties.map((prop: any) => (
                                        <div key={prop.ID} className="border rounded-lg p-4 bg-gray-50">
                                            <h3 className="font-bold text-lg mb-2">{prop.TITLE || `Imóvel #${prop.ID}`}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                {Object.entries(prop).map(([key, value]) => {
                                                    if (key === 'ID' || key === 'TITLE' || !value) return null;
                                                    return (
                                                        <div key={key}>
                                                            <span className="text-gray-600">{key}:</span> <span className="text-gray-800">{String(value)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4">🔒</div>
                        <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
                        <p className="text-gray-600 mb-4">
                            {data.message || 'Esta autorização foi criada por outro corretor'}
                        </p>
                        <div className="text-left max-w-md mx-auto mt-6 p-4 bg-gray-50 rounded">
                            <p className="text-sm text-gray-700 mb-2">
                                <strong>Você pode ver:</strong>
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>✓ Nome da empresa: {data.company.TITLE}</li>
                                <li>✓ Data de criação: {new Date(data.company.DATE_CREATE).toLocaleDateString('pt-BR')}</li>
                                <li>✓ Imóveis vinculados: {data.properties.map(p => p.TITLE).join(', ')}</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
