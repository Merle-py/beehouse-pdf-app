'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';

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

            const response = await fetch(`/api/bitrix/authorization/${companyId}?accessToken=${bitrix.authId}&domain=${bitrix.domain}`);
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

    const getCompanyTypeBadge = (type: string) => {
        const types: Record<string, { label: string; variant: any }> = {
            'CUSTOMER': { label: 'PF Solteiro', variant: 'info' },
            'PARTNER': { label: 'PF Casado', variant: 'success' },
            'SUPPLIER': { label: 'Sócios', variant: 'warning' },
            'COMPETITOR': { label: 'PJ', variant: 'default' }
        };
        return types[type] || { label: 'Outro', variant: 'default' };
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const formatCurrency = (value: any) => {
        if (!value) return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(num);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando detalhes..." />
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

    const typeBadge = getCompanyTypeBadge(data.company.COMPANY_TYPE);

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
                            <div className="flex items-center gap-3 mb-4">
                                <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                                {data.isOwner && (
                                    <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                                        ✓ Criado por você
                                    </span>
                                )}
                            </div>
                        </div>

                        {data.canEdit && (
                            <Link href={`/nova-autorizacao?companyId=${companyId}`} className="btn-primary">
                                ✏️ Editar
                            </Link>
                        )}
                    </div>
                </div>

                {data.canEdit ? (
                    <>
                        {/* Informações da Empresa */}
                        <div className="card mb-6">
                            <h2 className="text-2xl font-bold mb-4">Informações da Empresa</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.company.UF_CRM_CPF_CNPJ && (
                                    <div>
                                        <span className="text-sm text-gray-600 font-semibold">CPF/CNPJ:</span>
                                        <p className="text-gray-800">{data.company.UF_CRM_CPF_CNPJ}</p>
                                    </div>
                                )}
                                {data.company.EMAIL && (
                                    <div>
                                        <span className="text-sm text-gray-600 font-semibold">Email:</span>
                                        <p className="text-gray-800">
                                            {Array.isArray(data.company.EMAIL)
                                                ? (typeof data.company.EMAIL[0] === 'object' ? data.company.EMAIL[0]?.VALUE : data.company.EMAIL[0])
                                                : data.company.EMAIL}
                                        </p>
                                    </div>
                                )}
                                {data.company.PHONE && (
                                    <div>
                                        <span className="text-sm text-gray-600 font-semibold">Telefone:</span>
                                        <p className="text-gray-800">
                                            {Array.isArray(data.company.PHONE)
                                                ? (typeof data.company.PHONE[0] === 'object' ? data.company.PHONE[0]?.VALUE : data.company.PHONE[0])
                                                : data.company.PHONE}
                                        </p>
                                    </div>
                                )}
                                {data.company.DATE_CREATE && (
                                    <div>
                                        <span className="text-sm text-gray-600 font-semibold">Data de Criação:</span>
                                        <p className="text-gray-800">{formatDate(data.company.DATE_CREATE)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Imóveis Vinculados */}
                        <div className="card">
                            <h2 className="text-2xl font-bold mb-4">
                                Imóveis Vinculados ({data.properties.length})
                            </h2>

                            {data.properties.length === 0 ? (
                                <p className="text-gray-600">Nenhum imóvel vinculado a esta empresa</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.properties.map((prop: any) => (
                                        <div key={prop.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
                                            <h3 className="font-bold text-lg mb-3">{prop.title || `Imóvel #${prop.id}`}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                {prop.ufCrmPropertyAddress && (
                                                    <div>
                                                        <span className="text-gray-600 font-semibold">📍 Endereço:</span>
                                                        <p className="text-gray-800">{prop.ufCrmPropertyAddress}</p>
                                                    </div>
                                                )}
                                                {prop.ufCrmPropertyValue && (
                                                    <div>
                                                        <span className="text-gray-600 font-semibold">💰 Valor:</span>
                                                        <p className="text-gray-800">{formatCurrency(prop.ufCrmPropertyValue)}</p>
                                                    </div>
                                                )}
                                                {prop.ufCrmPropertyMatricula && (
                                                    <div>
                                                        <span className="text-gray-600 font-semibold">📄 Matrícula:</span>
                                                        <p className="text-gray-800">{prop.ufCrmPropertyMatricula}</p>
                                                    </div>
                                                )}
                                                {prop.ufCrmPropertyDescription && (
                                                    <div className="md:col-span-2">
                                                        <span className="text-gray-600 font-semibold">📝 Descrição:</span>
                                                        <p className="text-gray-800">{prop.ufCrmPropertyDescription}</p>
                                                    </div>
                                                )}
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
                                <strong>Informações disponíveis:</strong>
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>✓ Nome: {data.company.TITLE}</li>
                                <li>✓ Data de criação: {formatDate(data.company.DATE_CREATE)}</li>
                                <li>✓ Imóveis: {data.properties.length}</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
