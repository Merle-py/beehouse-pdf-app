'use client';

import { useState, useEffect } from 'react';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import Link from 'next/link';

interface PropertyInfo {
    id: string;
    name: string;
}

interface Authorization {
    companyId: string;
    companyName: string;
    createdAt: string;
    createdBy: string | null;
    createdByName: string;
    properties: PropertyInfo[];
}

export default function DashboardPage() {
    const bitrix = useBitrix24();
    const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (bitrix.isInitialized) {
            loadAuthorizations();
        }
    }, [bitrix.isInitialized]);

    const loadAuthorizations = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/bitrix/all-authorizations');
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Erro ao carregar autorizações');
            }

            setAuthorizations(data.authorizations || []);
        } catch (err: any) {
            console.error('[Dashboard] Erro:', err);
            setError(err.message || 'Erro ao carregar autorizations');
        } finally {
            setLoading(false);
        }
    };

    const isOwner = (auth: Authorization) => {
        return auth.createdBy === bitrix.authId;
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('pt-BR');
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-beehouse-secondary mb-2">
                            Autorizações de Venda
                        </h1>
                        <p className="text-gray-600">
                            {bitrix.isInsideBitrix
                                ? `Conectado como corretor - ${authorizations.length} autorização(ões)`
                                : 'Modo standalone'
                            }
                        </p>
                    </div>

                    <Link
                        href="/nova-autorizacao"
                        className="bg-beehouse-primary hover:bg-beehouse-accent text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        ➕ Nova Autorização
                    </Link>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando autorizações...</p>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-800 mb-4">❌ {error}</p>
                        <button
                            onClick={loadAuthorizations}
                            className="btn-primary"
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
                                    Nenhuma autorização cadastrada ainda
                                </p>
                                <Link href="/nova-autorizacao" className="btn-primary inline-block">
                                    Criar Primeira Autorização
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {authorizations.map((auth) => {
                                    const owned = isOwner(auth);

                                    return (
                                        <Link
                                            key={auth.companyId}
                                            href={`/autorizacao/${auth.companyId}`}
                                            className={`block card hover:shadow-xl transition-all ${owned
                                                    ? 'border-2 border-green-500 bg-green-50'
                                                    : 'border-2 border-gray-300 bg-white'
                                                }`}
                                        >
                                            {/* Badge de Propriedade */}
                                            <div className="mb-3">
                                                {owned ? (
                                                    <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                                                        ✓ SUA AUTORIZAÇÃO
                                                    </span>
                                                ) : (
                                                    <span className="bg-gray-400 text-white text-xs px-3 py-1 rounded-full">
                                                        Outro Corretor
                                                    </span>
                                                )}
                                            </div>

                                            {/* Nome da Empresa */}
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                                {auth.companyName}
                                            </h3>

                                            {/* Metadata */}
                                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                                <div>
                                                    <strong>Criado em:</strong> {formatDate(auth.createdAt)}
                                                </div>
                                                {!owned && (
                                                    <div>
                                                        <strong>Criado por:</strong> {auth.createdByName}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Imóveis */}
                                            {auth.properties.length > 0 && (
                                                <div className="pt-4 border-t border-gray-200">
                                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                                        Imóveis vinculados:
                                                    </p>
                                                    <ul className="space-y-1">
                                                        {auth.properties.slice(0, 3).map((prop) => (
                                                            <li key={prop.id} className="text-sm text-gray-600 flex items-center">
                                                                <span className="mr-2">🏠</span>
                                                                {prop.name}
                                                            </li>
                                                        ))}
                                                        {auth.properties.length > 3 && (
                                                            <li className="text-sm text-gray-500 italic">
                                                                +{auth.properties.length - 3} imóvel(is)
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Call to Action */}
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <span className={`text-sm font-semibold ${owned ? 'text-green-700' : 'text-gray-600'
                                                    }`}>
                                                    {owned ? 'Ver Detalhes e Editar →' : 'Ver Informações →'}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
